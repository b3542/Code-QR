// ===================== الحسابات الأساسية =====================
const MAIN_ACCOUNT = {
    username: "bilalayeb1996",
    password: "bilalayeb1996",
    fullName: "بلال عيب",
    role: "مدير عام",
    isMain: true
};

// ===================== دوال التخزين =====================
function saveAllData() {
    const allAccounts = getAllAccounts();
    localStorage.setItem("allAccounts", JSON.stringify(allAccounts));
}

function getAllAccounts() {
    const subAccounts = JSON.parse(localStorage.getItem("subAccounts") || "[]");
    return [MAIN_ACCOUNT, ...subAccounts];
}

function getSubAccounts() {
    return JSON.parse(localStorage.getItem("subAccounts") || "[]");
}

function saveSubAccounts(subAccounts) {
    localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
    saveAllData();
}

// ===================== دوال حفظ بيانات المستخدم (تم إصلاحها) =====================
function saveUserData(username, campers, campInfo) {
    if (!username) return;
    
    const userData = {
        campers: campers || [],
        campInfo: campInfo || { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" },
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
    console.log(`✅ تم حفظ بيانات المستخدم ${username} في ${new Date().toLocaleTimeString()}`);
}

function loadUserData(username) {
    if (!username) {
        return { campers: [], campInfo: { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" } };
    }
    
    const data = localStorage.getItem(`userData_${username}`);
    if (data) {
        const parsed = JSON.parse(data);
        console.log(`✅ تم تحميل بيانات المستخدم ${username}`);
        return parsed;
    }
    return {
        campers: [],
        campInfo: { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" }
    };
}

// ===================== المتغيرات العامة =====================
let currentUser = null;
let campersData = [];
let campData = {
    name: "مخيم الأمل",
    manager: "غير محدد",
    phone: "---",
    logo: ""
};
let fontSize = localStorage.getItem("titleFontSize") || 40;
let backgroundImage = localStorage.getItem("bgImage") || "";
let saveTimeout = null; // للحفظ المؤجل

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

// ===================== وظيفة الحفظ التلقائي (تم إصلاحها) =====================
function autoSave() {
    if (currentUser) {
        // حفظ فوري
        saveUserData(currentUser.username, campersData, campData);
        
        // إظهار مؤقت للحفظ (اختياري)
        const saveIndicator = document.getElementById("saveIndicator");
        if (saveIndicator) {
            saveIndicator.style.opacity = "1";
            setTimeout(() => {
                if (saveIndicator) saveIndicator.style.opacity = "0";
            }, 1000);
        }
    }
}

// حفظ مع تأخير (لتجنب الحفظ المتكرر)
function debounceAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        autoSave();
    }, 500);
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
        tableBody.innerHTML = `<tr><td colspan='7' style='text-align:center'>⚠️ لا توجد بيانات، أضف صفاً جديداً</td></table>`;
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
            // حفظ تلقائي عند التعديل
            debounceAutoSave();
        };
        
        nameInp.addEventListener("input", updateCamper);
        dobInp.addEventListener("change", updateCamper);
        supInp.addEventListener("input", updateCamper);
        phoneInp.addEventListener("input", updateCamper);
        
        row.querySelector(".delete-row-btn").addEventListener("click", () => {
            if (confirm("حذف هذا الشخص؟")) {
                campersData.splice(idx, 1);
                renderTable();
                autoSave(); // حفظ فوري عند الحذف
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
    autoSave();
}

function deleteAllRows() {
    if (confirm("⚠️ هل أنت متأكد من حذف جميع بيانات المصطافين؟")) {
        campersData = [];
        renderTable();
        autoSave();
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

// ===================== دوال تصدير واستيراد Excel =====================
function exportToExcel() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات للتصدير");
        return;
    }
    
    // إنشاء مصفوفة للبيانات
    const excelData = [
        ["اسم المصطاف", "تاريخ الميلاد", "المنشط المسؤول", "هاتف المنشط"]
    ];
    
    campersData.forEach(camper => {
        excelData.push([
            camper.name || "",
            camper.dob || "",
            camper.supervisor || "",
            camper.supervisorPhone || ""
        ]);
    });
    
    // إنشاء ورقة عمل
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // ضبط عرض الأعمدة
    ws['!cols'] = [{wch:25}, {wch:15}, {wch:20}, {wch:20}];
    
    // إنشاء مصنف
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "بيانات المخيم");
    
    // تصدير الملف
    const fileName = `بيانات_المخيم_${campData.name}_${new Date().toLocaleDateString('ar')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert("✅ تم تصدير البيانات بنجاح");
}

function importExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
                
                if (!rows || rows.length < 2) {
                    reject(new Error("الملف فارغ أو لا يحتوي على بيانات"));
                    return;
                }
                
                const importedCampers = [];
                // تخطي الصف الأول (العناوين)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length >= 1 && row[0] && row[0].toString().trim() !== "") {
                        importedCampers.push({
                            name: row[0]?.toString().trim() || "",
                            dob: row[1] ? formatDateForInput(row[1]) : "",
                            supervisor: row[2]?.toString().trim() || "",
                            supervisorPhone: row[3]?.toString().trim() || ""
                        });
                    }
                }
                
                resolve(importedCampers);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error("فشل قراءة الملف"));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function formatDateForInput(dateValue) {
    if (!dateValue) return "";
    
    // محاولة تحويل التاريخ
    try {
        let date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            // محاولة قراءة التاريخ كنص
            const dateStr = dateValue.toString();
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return "";
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        return "";
    }
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
    if (currentUser) {
        autoSave(); // حفظ قبل الخروج
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
function addSubAccount(fullName, username, password, role) {
    const subAccounts = getSubAccounts();
    
    const existing = subAccounts.find(acc => acc.username === username);
    if (existing) {
        alert("⚠️ اسم المستخدم موجود مسبقاً!");
        return false;
    }
    
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

function deleteSubAccount(username) {
    let subAccounts = getSubAccounts();
    const index = subAccounts.findIndex(acc => acc.username === username);
    
    if (index !== -1) {
        subAccounts.splice(index, 1);
        saveSubAccounts(subAccounts);
        localStorage.removeItem(`userData_${username}`);
        alert(`✅ تم حذف الحساب ${username} بنجاح`);
        return true;
    }
    return false;
}

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
                    showAllSubAccounts();
                }
            };
            
            accountsListDiv.appendChild(accountDiv);
        });
    }
    
    document.getElementById("listAccountsModal").style.display = "flex";
}

// ===================== تسجيل الدخول =====================
function login(username, password) {
    if (username === MAIN_ACCOUNT.username && password === MAIN_ACCOUNT.password) {
        currentUser = MAIN_ACCOUNT;
        return true;
    }
    
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
        const userData = loadUserData(currentUser.username);
        campersData = userData.campers || [];
        campData = userData.campInfo || { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" };
        
        loginScreen.style.display = "none";
        mainAppDiv.style.display = "block";
        
        loadCampDataToUI();
        renderTable();
        applySettings();
        setupSearch();
        
        setTimeout(() => {
            alert(`👋 مرحباً ${currentUser.fullName}\n🎭 الدور: ${currentUser.role}`);
        }, 100);
    } else {
        document.getElementById("loginError").innerText = "❌ اسم المستخدم أو كلمة المرور غير صحيحة";
    }
};

document.getElementById("loginPassword").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("doLoginBtn").click();
});

// ===================== أزرار التحكم الرئيسية =====================
document.getElementById("fillFormBtn").onclick = () => addEmptyRow();
document.getElementById("deleteAllRowsBtn").onclick = () => deleteAllRows();
document.getElementById("generateQRBtn").onclick = () => generateAllQRs();
document.getElementById("downloadAllQrBtn").onclick = () => downloadAllQRCodes();
document.getElementById("exportExcelBtn").onclick = () => exportToExcel();

// زر استيراد Excel
document.getElementById("importExcelBtn").onclick = () => {
    document.getElementById("importExcelModal").style.display = "flex";
};

document.getElementById("confirmImportBtn").onclick = async () => {
    const fileInput = document.getElementById("excelFileInput");
    const file = fileInput.files[0];
    
    if (!file) {
        alert("⚠️ الرجاء اختيار ملف Excel أولاً");
        return;
    }
    
    showProgress(true, "جاري استيراد البيانات...", 0);
    
    try {
        const importedCampers = await importExcel(file);
        
        if (importedCampers.length === 0) {
            alert("⚠️ لم يتم العثور على بيانات في الملف");
            showProgress(false);
            return;
        }
        
        // إضافة البيانات المستوردة إلى البيانات الحالية
        campersData.push(...importedCampers);
        renderTable();
        autoSave();
        
        document.getElementById("importExcelModal").style.display = "none";
        fileInput.value = "";
        
        showProgress(false);
        alert(`✅ تم استيراد ${importedCampers.length} سجل بنجاح!`);
    } catch (error) {
        showProgress(false);
        alert("❌ خطأ في استيراد الملف: " + error.message);
    }
};

document.getElementById("closeImportModal").onclick = () => {
    document.getElementById("importExcelModal").style.display = "none";
    document.getElementById("excelFileInput").value = "";
};

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
    
    document.getElementById("subName").value = "";
    document.getElementById("subUsername").value = "";
    document.getElementById("subPassword").value = "";
    document.getElementById("subConfirmPassword").value = "";
    document.getElementById("subAccountModal").style.display = "none";
};

document.getElementById("listSubAccountsBtn").onclick = () => {
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
            autoSave();
            loadCampDataToUI();
            if (campersData.length > 0) {
                setTimeout(() => generateAllQRs(), 500);
            }
        };
        reader.readAsDataURL(logoFile);
    } else {
        autoSave();
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

// ===================== حفظ تلقائي عند إغلاق الصفحة =====================
window.addEventListener("beforeunload", () => {
    if (currentUser) {
        autoSave();
    }
});

// ===================== التحميل الأولي =====================
applySettings();

if (!localStorage.getItem("subAccounts")) {
    localStorage.setItem("subAccounts", "[]");
}

// إضافة مؤشر حفظ (اختياري)
const saveIndicator = document.createElement("div");
saveIndicator.id = "saveIndicator";
saveIndicator.style.cssText = "position:fixed; bottom:20px; right:20px; background:#15803d; color:white; padding:8px 16px; border-radius:40px; font-size:12px; opacity:0; transition:opacity 0.3s; z-index:9999;";
saveIndicator.innerHTML = "💾 تم الحفظ";
document.body.appendChild(saveIndicator);