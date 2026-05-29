// ===================== الحسابات الأساسية =====================
// الحساب الرئيسي (ثابت)
const MAIN_ACCOUNT = {
    username: "bilalayeb1996",
    password: "bilalayeb1996",
    fullName: "بلال عيب",
    role: "مدير عام",
    isMain: true
};

// ===================== دوال التخزين =====================
// حفظ جميع البيانات في localStorage
function saveAllData() {
    const allAccounts = getAllAccounts();
    localStorage.setItem("allAccounts", JSON.stringify(allAccounts));
}

// الحصول على جميع الحسابات (الرئيسي + الفرعية)
function getAllAccounts() {
    const subAccounts = JSON.parse(localStorage.getItem("subAccounts") || "[]");
    return [MAIN_ACCOUNT, ...subAccounts];
}

// الحصول على حسابات فرعية فقط
function getSubAccounts() {
    return JSON.parse(localStorage.getItem("subAccounts") || "[]");
}

// حفظ الحسابات الفرعية
function saveSubAccounts(subAccounts) {
    localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
    saveAllData();
}

// حفظ بيانات مستخدم معين (المصطافين ومعلومات المخيم)
function saveUserData(username, campers, campInfo) {
    const userData = {
        campers: campers,
        campInfo: campInfo,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
}

// تحميل بيانات مستخدم معين
function loadUserData(username) {
    const data = localStorage.getItem(`userData_${username}`);
    if (data) {
        return JSON.parse(data);
    }
    return {
        campers: [],
        campInfo: { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" }
    };
}

// ===================== المتغيرات العامة =====================
let currentUser = null;      // المستخدم الحالي
let campersData = [];        // بيانات المصطافين
let campData = {             // بيانات المخيم
    name: "مخيم الأمل",
    manager: "غير محدد",
    phone: "---",
    logo: ""
};
let fontSize = localStorage.getItem("titleFontSize") || 40;
let backgroundImage = localStorage.getItem("bgImage") || "";

// عناصر DOM
const loginScreen = document.getElementById("loginScreen");
const mainAppDiv = document.getElementById("mainApp");
const tableBody = document.getElementById("tableBody");

// ===================== دوال مساعدة =====================
function showProgress(show, text = "جاري المعالجة...", percent = 0) {
    const overlay = document.getElementById("progressOverlay");
    const progressText = document.getElementById("progressText");
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    
    if (show) {
        overlay.style.display = "flex";
        if (progressText) progressText.innerText = text;
        if (progressFill) progressFill.style.width = percent + "%";
        if (progressPercent) progressPercent.innerText = percent + "%";
    } else {
        overlay.style.display = "none";
    }
}

function sanitizeFileName(name) {
    if (!name || name.trim() === "") return "مصطاف";
    return name.trim().replace(/[\\/:*?"<>|]/g, '').substring(0, 50);
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===================== إنشاء QR =====================
async function generateSingleQR(rowIndex, camper) {
    return new Promise((resolve) => {
        const campName = campData.name || "مخيم";
        const managerInfo = campData.manager || "غير محدد";
        const phoneManager = campData.phone || "---";
        const qrText = `🏕️ المخيم: ${campName}\n👤 مدير المركز: ${managerInfo}\n📞 هاتف المدير: ${phoneManager}\n\n🧑 المصطاف: ${camper.name}\n📅 تاريخ الميلاد: ${camper.dob}\n👨‍🏫 المنشط المسؤول: ${camper.supervisor}\n📞 هاتف المنشط: ${camper.supervisorPhone}`;
        
        const qrContainer = document.getElementById(`qrContainer_${rowIndex}`);
        if (!qrContainer) {
            resolve(false);
            return;
        }
        
        qrContainer.innerHTML = "";
        qrContainer.className = "qr-container";
        
        const canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;
        qrContainer.appendChild(canvas);
        
        QRCode.toCanvas(canvas, qrText, {
            width: 100,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        }, function(error) {
            if (error) {
                qrContainer.innerHTML = '<div class="qr-placeholder">❌ خطأ</div>';
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function downloadQRImageFromCanvas(containerId, fileName) {
    const container = document.getElementById(containerId);
    if (!container) { alert("خطأ في العنصر"); return false; }
    
    const canvas = container.querySelector('canvas');
    if (!canvas) {
        alert("⚠️ الرجاء إنشاء QR أولاً");
        return false;
    }
    
    try {
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return true;
    } catch(e) {
        alert("فشل تحميل الصورة");
        return false;
    }
}

// ===================== عرض الجدول =====================
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    if (campersData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan='7' style='text-align:center'>⚠️ لا توجد بيانات، أضف صفاً جديداً</td></tr>`;
        updateStats();
        return;
    }
    
    campersData.forEach((camper, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="text" class="name-input" value="${escapeHtml(camper.name)}" placeholder="الاسم الكامل"></td>
            <td><input type="date" class="dob-input" value="${camper.dob || ""}"></td>
            <td><input type="text" class="supervisor-input" value="${escapeHtml(camper.supervisor)}" placeholder="اسم المنشط"></td>
            <td><input type="tel" class="supervisor-phone" value="${escapeHtml(camper.supervisorPhone)}" placeholder="رقم الهاتف"></td>
            <td class="qr-cell"><div id="qrContainer_${idx}" class="qr-container qr-placeholder">🔄 اضغط إنشاء QR</div></td>
            <td><button class="download-qr-btn" data-idx="${idx}">📸 تحميل</button></td>
            <td><button class="delete-row-btn" data-idx="${idx}">🗑️ حذف</button></td>
        `;
        
        const nameInp = row.querySelector(".name-input");
        const dobInp = row.querySelector(".dob-input");
        const supInp = row.querySelector(".supervisor-input");
        const phoneInp = row.querySelector(".supervisor-phone");
        
        const updateCamper = () => {
            campersData[idx] = {
                name: nameInp.value,
                dob: dobInp.value,
                supervisor: supInp.value,
                supervisorPhone: phoneInp.value
            };
            // حفظ البيانات تلقائياً
            saveUserData(currentUser.username, campersData, campData);
        };
        
        nameInp.addEventListener("input", updateCamper);
        dobInp.addEventListener("change", updateCamper);
        supInp.addEventListener("input", updateCamper);
        phoneInp.addEventListener("input", updateCamper);
        
        row.querySelector(".delete-row-btn").addEventListener("click", () => {
            if (confirm("حذف هذا الشخص؟")) {
                campersData.splice(idx, 1);
                renderTable();
                saveUserData(currentUser.username, campersData, campData);
            }
        });
        
        row.querySelector(".download-qr-btn").addEventListener("click", async () => {
            const currentCamper = campersData[idx];
            if (!currentCamper.name || currentCamper.name.trim() === "") {
                alert("يرجى إدخال اسم المصطاف أولاً");
                return;
            }
            
            const qrDiv = document.getElementById(`qrContainer_${idx}`);
            if (!qrDiv || !qrDiv.querySelector('canvas')) {
                await generateSingleQR(idx, currentCamper);
            }
            
            const fileName = sanitizeFileName(currentCamper.name);
            downloadQRImageFromCanvas(`qrContainer_${idx}`, fileName);
        });
        
        tableBody.appendChild(row);
    });
    
    updateStats();
}

function updateStats() {
    const countSpan = document.getElementById("campersCount");
    if (countSpan) countSpan.innerText = campersData.length;
}

// ===================== دوال التحكم =====================
function addEmptyRow() {
    campersData.push({ name: "", dob: "", supervisor: "", supervisorPhone: "" });
    renderTable();
    saveUserData(currentUser.username, campersData, campData);
}

function deleteAllRows() {
    if (confirm("⚠️ هل أنت متأكد من حذف جميع بيانات المصطافين؟")) {
        campersData = [];
        renderTable();
        saveUserData(currentUser.username, campersData, campData);
    }
}

async function generateAllQRs() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات، قم بإضافة أشخاص أولاً");
        return;
    }
    
    showProgress(true, "جاري إنشاء أكواد QR...", 0);
    
    for (let i = 0; i < campersData.length; i++) {
        const percent = Math.round((i / campersData.length) * 100);
        showProgress(true, `جاري إنشاء QR للمصطاف ${i+1} من ${campersData.length}`, percent);
        await generateSingleQR(i, campersData[i]);
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    showProgress(false);
    alert("✅ تم إنشاء جميع أكواد QR بنجاح!");
}

async function downloadAllQRCodes() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات");
        return;
    }
    
    showProgress(true, "جاري تحضير الأكواد...", 0);
    
    for (let i = 0; i < campersData.length; i++) {
        const qrDiv = document.getElementById(`qrContainer_${i}`);
        const percent = Math.round((i / campersData.length) * 100);
        showProgress(true, `جاري تجهيز QR رقم ${i+1}`, percent);
        
        if (!qrDiv || !qrDiv.querySelector('canvas')) {
            await generateSingleQR(i, campersData[i]);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    for (let i = 0; i < campersData.length; i++) {
        const camper = campersData[i];
        let fileName = sanitizeFileName(camper.name);
        if (!camper.name || camper.name.trim() === "") fileName = `مصطاف_${i+1}`;
        downloadQRImageFromCanvas(`qrContainer_${i}`, fileName);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    showProgress(false);
    alert("✅ تم تحميل جميع الأكواد");
}

function exportToExcel() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات للتصدير");
        return;
    }
    
    let csv = "اسم المصطاف,تاريخ الميلاد,المنشط المسؤول,هاتف المنشط\n";
    campersData.forEach(camper => {
        csv += `"${camper.name}",${camper.dob},"${camper.supervisor}","${camper.supervisorPhone}"\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "بيانات_المخيم.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("✅ تم تصدير البيانات بنجاح");
}

// ===================== دوال الواجهة =====================
function loadCampDataToUI() {
    document.getElementById("campNameHeader").innerText = campData.name || "مخيم";
    const campLogo = document.getElementById("campLogoImg");
    
    if (campData.logo && campData.logo !== "") {
        campLogo.src = campData.logo;
        campLogo.style.display = "inline-block";
    } else {
        campLogo.style.display = "none";
    }
    
    const detailsDiv = document.getElementById("campDetailsDisplay");
    detailsDiv.innerHTML = `🏕️ <strong>${campData.name}</strong> | مدير المركز: ${campData.manager} | 📞 هاتف المدير: ${campData.phone}`;
}

function applySettings() {
    document.getElementById("qrMainTitle").style.fontSize = fontSize + "px";
    if (backgroundImage && backgroundImage !== "") {
        mainAppDiv.style.backgroundImage = `url('${backgroundImage}')`;
        mainAppDiv.style.backgroundSize = "cover";
    }
    document.getElementById("fontRange").value = fontSize;
}

function logout() {
    // حفظ البيانات قبل الخروج
    if (currentUser) {
        saveUserData(currentUser.username, campersData, campData);
    }
    currentUser = null;
    loginScreen.style.display = "flex";
    mainAppDiv.style.display = "none";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").innerText = "";
}

// ===================== البحث =====================
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll("#tableBody tr");
            
            rows.forEach(row => {
                if (row.cells.length > 0) {
                    const nameCell = row.cells[0]?.textContent.toLowerCase() || "";
                    row.style.display = nameCell.includes(searchTerm) ? "" : "none";
                }
            });
        });
    }
}

// ===================== إدارة الحسابات الفرعية =====================
// إضافة حساب فرعي جديد
function addSubAccount(fullName, username, password, role) {
    const subAccounts = getSubAccounts();
    
    // التحقق من عدم وجود اسم المستخدم مسبقاً
    const existing = subAccounts.find(acc => acc.username === username);
    if (existing) {
        alert("⚠️ اسم المستخدم موجود مسبقاً!");
        return false;
    }
    
    // إضافة الحساب الجديد
    subAccounts.push({
        username: username,
        password: password,
        fullName: fullName,
        role: role,
        isMain: false,
        createdAt: new Date().toISOString()
    });
    
    saveSubAccounts(subAccounts);
    alert(`✅ تم إضافة الحساب الفرعي بنجاح!\n\nاسم المستخدم: ${username}\nكلمة المرور: ${password}`);
    return true;
}

// حذف حساب فرعي
function deleteSubAccount(username) {
    let subAccounts = getSubAccounts();
    const index = subAccounts.findIndex(acc => acc.username === username);
    
    if (index !== -1) {
        subAccounts.splice(index, 1);
        saveSubAccounts(subAccounts);
        
        // حذف بيانات المستخدم
        localStorage.removeItem(`userData_${username}`);
        
        alert(`✅ تم حذف الحساب ${username} بنجاح`);
        return true;
    }
    return false;
}

// عرض جميع الحسابات الفرعية
function showAllSubAccounts() {
    const subAccounts = getSubAccounts();
    const accountsListDiv = document.getElementById("accountsList");
    
    if (subAccounts.length === 0) {
        accountsListDiv.innerHTML = '<p style="text-align:center; color:#666;">📭 لا يوجد حسابات فرعية حالياً</p>';
    } else {
        accountsListDiv.innerHTML = "";
        subAccounts.forEach(acc => {
            const accountDiv = document.createElement("div");
            accountDiv.className = "account-item";
            accountDiv.innerHTML = `
                <h4>👤 ${acc.fullName}</h4>
                <p><strong>📧 اسم المستخدم:</strong> ${acc.username}</p>
                <p><strong>🔑 كلمة المرور:</strong> ${acc.password}</p>
                <p><strong>🎭 الدور:</strong> ${acc.role}</p>
                <p><strong>📅 تاريخ الإنشاء:</strong> ${new Date(acc.createdAt).toLocaleDateString('ar')}</p>
                <button class="delete-account-btn" data-username="${acc.username}">🗑️ حذف هذا الحساب</button>
            `;
            
            const deleteBtn = accountDiv.querySelector(".delete-account-btn");
            deleteBtn.onclick = () => {
                if (confirm(`⚠️ هل أنت متأكد من حذف حساب ${acc.fullName}؟\nسيتم حذف جميع بياناته بشكل نهائي.`)) {
                    deleteSubAccount(acc.username);
                    showAllSubAccounts(); // تحديث العرض
                }
            };
            
            accountsListDiv.appendChild(accountDiv);
        });
    }
    
    document.getElementById("listAccountsModal").style.display = "flex";
}

// ===================== تسجيل الدخول =====================
function login(username, password) {
    // التحقق من الحساب الرئيسي
    if (username === MAIN_ACCOUNT.username && password === MAIN_ACCOUNT.password) {
        currentUser = MAIN_ACCOUNT;
        return true;
    }
    
    // التحقق من الحسابات الفرعية
    const subAccounts = getSubAccounts();
    const subUser = subAccounts.find(acc => acc.username === username && acc.password === password);
    
    if (subUser) {
        currentUser = subUser;
        return true;
    }
    
    return false;
}

// ===================== أحداث تسجيل الدخول =====================
document.getElementById("doLoginBtn").onclick = () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if (!username || !password) {
        document.getElementById("loginError").innerText = "❌ الرجاء إدخال اسم المستخدم وكلمة المرور";
        return;
    }
    
    if (login(username, password)) {
        // تحميل بيانات المستخدم
        const userData = loadUserData(currentUser.username);
        campersData = userData.campers;
        campData = userData.campInfo;
        
        // عرض التطبيق
        loginScreen.style.display = "none";
        mainAppDiv.style.display = "block";
        
        // تحديث الواجهة
        loadCampDataToUI();
        renderTable();
        applySettings();
        setupSearch();
        
        // رسالة ترحيب
        setTimeout(() => {
            alert(`👋 مرحباً ${currentUser.fullName}\n🎭 الدور: ${currentUser.role}`);
        }, 100);
    } else {
        document.getElementById("loginError").innerText = "❌ اسم المستخدم أو كلمة المرور غير صحيحة";
    }
};

// الضغط على Enter
document.getElementById("loginPassword").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("doLoginBtn").click();
});

// ===================== أزرار التحكم الرئيسية =====================
document.getElementById("fillFormBtn").onclick = () => addEmptyRow();
document.getElementById("deleteAllRowsBtn").onclick = () => deleteAllRows();
document.getElementById("generateQRBtn").onclick = () => generateAllQRs();
document.getElementById("downloadAllQrBtn").onclick = () => downloadAllQRCodes();
document.getElementById("exportExcelBtn").onclick = () => exportToExcel();
document.getElementById("logoutBtn").onclick = () => logout();

// ===================== الإعدادات =====================
document.getElementById("settingsMainBtn").onclick = () => {
    document.getElementById("settingsModal").style.display = "flex";
};
document.getElementById("closeSettings").onclick = () => {
    document.getElementById("settingsModal").style.display = "none";
};

document.getElementById("fontRange").oninput = function(e) {
    fontSize = e.target.value;
    localStorage.setItem("titleFontSize", fontSize);
    document.getElementById("qrMainTitle").style.fontSize = fontSize + "px";
};

document.getElementById("bgImageUpload").onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            backgroundImage = ev.target.result;
            localStorage.setItem("bgImage", backgroundImage);
            mainAppDiv.style.backgroundImage = `url('${backgroundImage}')`;
            mainAppDiv.style.backgroundSize = "cover";
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById("fullscreenToggle").onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

// ===================== إدارة الحسابات الفرعية =====================
document.getElementById("addSubAccountBtn").onclick = () => {
    // فقط الحساب الرئيسي يمكنه إضافة حسابات فرعية
    if (currentUser && currentUser.username === MAIN_ACCOUNT.username) {
        document.getElementById("subAccountModal").style.display = "flex";
    } else {
        alert("⚠️ فقط المدير العام يمكنه إضافة حسابات فرعية");
    }
};

document.getElementById("saveSubAccountBtn").onclick = () => {
    const fullName = document.getElementById("subName").value.trim();
    const username = document.getElementById("subUsername").value.trim();
    const password = document.getElementById("subPassword").value;
    const confirmPassword = document.getElementById("subConfirmPassword").value;
    const role = document.getElementById("subRole").value;
    
    if (!fullName || !username || !password) {
        alert("⚠️ الرجاء ملء جميع الحقول");
        return;
    }
    
    if (password !== confirmPassword) {
        alert("⚠️ كلمة المرور وتأكيدها غير متطابقين");
        return;
    }
    
    if (password.length < 4) {
        alert("⚠️ كلمة المرور يجب أن تكون 4 أحرف على الأقل");
        return;
    }
    
    addSubAccount(fullName, username, password, role);
    
    // تنظيف الحقول
    document.getElementById("subName").value = "";
    document.getElementById("subUsername").value = "";
    document.getElementById("subPassword").value = "";
    document.getElementById("subConfirmPassword").value = "";
    document.getElementById("subAccountModal").style.display = "none";
};

document.getElementById("listSubAccountsBtn").onclick = () => {
    // فقط الحساب الرئيسي يمكنه عرض الحسابات الفرعية
    if (currentUser && currentUser.username === MAIN_ACCOUNT.username) {
        showAllSubAccounts();
    } else {
        alert("⚠️ فقط المدير العام يمكنه عرض الحسابات الفرعية");
    }
};

document.getElementById("closeSubModal").onclick = () => {
    document.getElementById("subAccountModal").style.display = "none";
};

document.getElementById("closeListModal").onclick = () => {
    document.getElementById("listAccountsModal").style.display = "none";
};

// ===================== معلومات المخيم =====================
document.getElementById("addCampInfoBtn").onclick = () => {
    document.getElementById("campInfoModal").style.display = "flex";
    document.getElementById("campName").value = campData.name;
    document.getElementById("campManager").value = campData.manager;
    document.getElementById("campPhone").value = campData.phone;
};

document.getElementById("saveCampInfoBtn").onclick = () => {
    const name = document.getElementById("campName").value;
    const manager = document.getElementById("campManager").value;
    const phone = document.getElementById("campPhone").value;
    const logoFile = document.getElementById("campLogoUpload").files[0];
    
    if (name) campData.name = name;
    if (manager) campData.manager = manager;
    if (phone) campData.phone = phone;
    
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            campData.logo = e.target.result;
            saveUserData(currentUser.username, campersData, campData);
            loadCampDataToUI();
            if (campersData.length > 0) {
                setTimeout(() => generateAllQRs(), 500);
            }
        };
        reader.readAsDataURL(logoFile);
    } else {
        saveUserData(currentUser.username, campersData, campData);
        loadCampDataToUI();
        if (campersData.length > 0) {
            generateAllQRs();
        }
    }
    
    document.getElementById("campInfoModal").style.display = "none";
};

document.getElementById("closeCampModal").onclick = () => {
    document.getElementById("campInfoModal").style.display = "none";
};

// ===================== التحميل الأولي =====================
applySettings();

// التحقق من وجود بيانات أولية
if (!localStorage.getItem("subAccounts")) {
    localStorage.setItem("subAccounts", "[]");
}