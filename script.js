// ===================== الحسابات الأساسية =====================
const MAIN_ACCOUNT = {
    username: "bilalayeb1996",
    password: "bilalayeb1996",
    fullName: "بلال عايب",
    role: "مدير عام",
    isMain: true
};

// ===================== دوال التخزين =====================
function getSubAccounts() {
    return JSON.parse(localStorage.getItem("subAccounts") || "[]");
}

function saveSubAccounts(subAccounts) {
    localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
}

function saveUserData(username, campers, campInfo) {
    if (!username) return;
    const userData = {
        campers: campers || [],
        campInfo: campInfo || { name: " ", manager: " ", phone: "", logo: "" },
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
    showSaveIndicator();
}

function loadUserData(username) {
    if (!username) return { campers: [], campInfo: { name: " ", manager: " ", phone: "", logo: "" } };
    const data = localStorage.getItem(`userData_${username}`);
    return data ? JSON.parse(data) : { campers: [], campInfo: { name: " ", manager: " ", phone: "", logo: "" } };
}

// ===================== المتغيرات العامة =====================
let currentUser = null;
let campersData = [];
let campData = { name: " ", manager: " ", phone: "", logo: "" };
let fontSize = localStorage.getItem("titleFontSize") || 40;
let backgroundImage = localStorage.getItem("bgImage") || "";
let saveTimeout = null;

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

function showSaveIndicator() {
    let indicator = document.getElementById("saveIndicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.id = "saveIndicator";
        indicator.innerHTML = "💾 تم الحفظ";
        document.body.appendChild(indicator);
    }
    indicator.style.opacity = "1";
    setTimeout(() => { indicator.style.opacity = "0"; }, 1500);
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

function convertToEnglishNumbers(str) {
    if (!str) return str;
    const arabicNumbers = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return str.toString().replace(/[٠-٩]/g, (d) => arabicNumbers[d]);
}

function autoSave() {
    if (currentUser) {
        saveUserData(currentUser.username, campersData, campData);
    }
}

function debounceAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(autoSave, 500);
}

// ===================== شريط البحث المُصلح بالكامل =====================
function filterTable() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearSearchBtn");
    const searchInfo = document.getElementById("searchInfo");
    const resultCountSpan = document.getElementById("resultCount");
    const mainCountSpan = document.getElementById("campersCount");
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // إظهار/إخفاء زر المسح
    if (clearBtn) {
        clearBtn.style.display = searchTerm ? "block" : "none";
    }
    
    // الحصول على جميع الصفوف في الجدول
    const rows = document.querySelectorAll("#tableBody tr");
    
    if (rows.length === 0) {
        if (mainCountSpan) mainCountSpan.innerText = "0";
        if (searchInfo) searchInfo.style.display = "none";
        return;
    }
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        // التأكد من وجود خلايا في الصف
        if (!row.cells || row.cells.length < 5) return;
        
        // الحصول على النصوص من الأعمدة المطلوبة
        // العمود 1 = اسم المصطاف (بعد عمود الترقيم)
        // العمود 3 = المنشط المسؤول
        const nameCell = row.cells[1]?.textContent.toLowerCase() || "";
        const supervisorCell = row.cells[3]?.textContent.toLowerCase() || "";
        
        let matches = false;
        
        if (searchTerm === "") {
            matches = true;
        } else {
            // البحث في اسم المصطاف OR المنشط المسؤول
            matches = nameCell.includes(searchTerm) || supervisorCell.includes(searchTerm);
        }
        
        if (matches) {
            row.style.display = "";
            visibleCount++;
            // إضافة تأثير تمييز مؤقت للصفوف المطابقة
            if (searchTerm !== "") {
                row.style.backgroundColor = "#e8f0fe";
                setTimeout(() => {
                    if (document.getElementById("searchInput")?.value.trim().toLowerCase() === searchTerm) {
                        row.style.backgroundColor = "";
                    }
                }, 800);
            } else {
                row.style.backgroundColor = "";
            }
        } else {
            row.style.display = "none";
            row.style.backgroundColor = "";
        }
    });
    
    // تحديث الإحصائيات
    if (searchTerm === "") {
        if (searchInfo) searchInfo.style.display = "none";
        if (mainCountSpan) mainCountSpan.innerText = campersData.length;
    } else {
        if (searchInfo) {
            searchInfo.style.display = "inline";
            if (resultCountSpan) resultCountSpan.innerText = visibleCount;
        }
        if (mainCountSpan) mainCountSpan.innerText = visibleCount;
    }
}

// ===================== إنشاء QR بجودة عالية 500×500 =====================
async function generateSingleQR(rowIndex, camper) {
    return new Promise((resolve) => {
        const qrText = `🏕️ المخيم: ${campData.name}\n👤 مدير المركز: ${campData.manager}\n📞 هاتف المدير: ${campData.phone}\n\n🧑 المصطاف: ${camper.name}\n📅 تاريخ الميلاد: ${camper.dob}\n👨‍🏫 المنشط المسؤول: ${camper.supervisor}\n📞 هاتف المنشط: ${camper.supervisorPhone}`;
        
        const qrContainer = document.getElementById(`qrContainer_${rowIndex}`);
        if (!qrContainer) {
            resolve(false);
            return;
        }
        
        qrContainer.innerHTML = "";
        qrContainer.className = "qr-container";
        
        const canvas = document.createElement("canvas");
        const qrSize = 500;
        canvas.width = qrSize;
        canvas.height = qrSize;
        canvas.style.width = "100px";
        canvas.style.height = "100px";
        canvas.style.maxWidth = "100px";
        canvas.style.maxHeight = "100px";
        qrContainer.appendChild(canvas);
        
        QRCode.toCanvas(canvas, qrText, {
            width: qrSize,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        }, function(error) {
            if (error) {
                console.error("QR Error:", error);
                qrContainer.innerHTML = '<div class="qr-placeholder">❌ خطأ</div>';
                resolve(false);
            } else {
                canvas.style.imageRendering = "crisp-edges";
                resolve(true);
            }
        });
    });
}

function downloadQRImageFromCanvas(containerId, fileName) {
    const container = document.getElementById(containerId);
    if (!container) { alert("خطأ"); return false; }
    
    const originalCanvas = container.querySelector('canvas');
    if (!originalCanvas) {
        alert("⚠️ الرجاء إنشاء QR أولاً");
        return false;
    }
    
    try {
        const highResCanvas = document.createElement('canvas');
        const highResSize = 2000;
        highResCanvas.width = highResSize;
        highResCanvas.height = highResSize;
        const ctx = highResCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(originalCanvas, 0, 0, highResSize, highResSize);
        
        const link = document.createElement('a');
        link.download = `${fileName}_QR.png`;
        link.href = highResCanvas.toDataURL('image/png', 1.0);
        link.click();
        return true;
    } catch(e) {
        console.error("Download error:", e);
        alert("فشل التحميل");
        return false;
    }
}

// ===================== عرض الجدول مع ترقيم =====================
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    if (campersData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan='8' style='text-align:center'>⚠️ لا توجد بيانات، أضف صفاً جديداً</td></tr>`;
        updateStats();
        // تحديث البحث
        filterTable();
        return;
    }
    
    campersData.forEach((camper, idx) => {
        const row = document.createElement("tr");
        row.setAttribute("data-idx", idx);
        
        let dobValue = camper.dob || "";
        dobValue = convertToEnglishNumbers(dobValue);
        
        row.innerHTML = `
            <td style="font-weight:bold; color:#2a5298;">${idx + 1}</td>
            <td><input type="text" class="name-input" value="${escapeHtml(camper.name)}" placeholder="الاسم الكامل"></td>
            <td><input type="text" class="dob-input" value="${dobValue}" placeholder="YYYY-MM-DD" dir="ltr" style="text-align:center; direction:ltr;"></td>
            <td><input type="text" class="supervisor-input" value="${escapeHtml(camper.supervisor)}" placeholder="اسم المنشط"></td>
            <td><input type="tel" class="supervisor-phone" value="${escapeHtml(camper.supervisorPhone)}" placeholder="رقم الهاتف"></td>
            <td class="qr-cell"><div id="qrContainer_${idx}" class="qr-container qr-placeholder">🔄 اضغط إنشاء</div></td>
            <td><button class="download-qr-btn" data-idx="${idx}">📸 تحميل</button></td>
            <td><button class="delete-row-btn" data-idx="${idx}">🗑️ حذف</button></td>
        `;
        
        const nameInp = row.querySelector(".name-input");
        const dobInp = row.querySelector(".dob-input");
        const supInp = row.querySelector(".supervisor-input");
        const phoneInp = row.querySelector(".supervisor-phone");
        
        const updateCamper = () => {
            let dobValue = dobInp.value;
            if (dobValue) {
                dobValue = convertToEnglishNumbers(dobValue);
                if (dobInp.value !== dobValue) dobInp.value = dobValue;
            }
            
            campersData[idx] = {
                name: nameInp.value,
                dob: dobValue,
                supervisor: supInp.value,
                supervisorPhone: phoneInp.value
            };
            debounceAutoSave();
            // تحديث البحث بعد التعديل
            filterTable();
        };
        
        nameInp.addEventListener("input", updateCamper);
        dobInp.addEventListener("input", updateCamper);
        dobInp.addEventListener("change", updateCamper);
        supInp.addEventListener("input", updateCamper);
        phoneInp.addEventListener("input", updateCamper);
        
        row.querySelector(".delete-row-btn").addEventListener("click", () => {
            if (confirm("حذف هذا الشخص؟")) {
                campersData.splice(idx, 1);
                renderTable();
                autoSave();
            }
        });
        
        row.querySelector(".download-qr-btn").addEventListener("click", async () => {
            const currentCamper = campersData[idx];
            if (!currentCamper.name?.trim()) {
                alert("يرجى إدخال اسم المصطاف أولاً");
                return;
            }
            const qrDiv = document.getElementById(`qrContainer_${idx}`);
            if (!qrDiv?.querySelector('canvas')) {
                await generateSingleQR(idx, currentCamper);
            }
            downloadQRImageFromCanvas(`qrContainer_${idx}`, sanitizeFileName(currentCamper.name));
        });
        
        tableBody.appendChild(row);
    });
    
    updateStats();
    // تحديث البحث بعد رسم الجدول
    filterTable();
}

function updateStats() {
    const span = document.getElementById("campersCount");
    if (span) span.innerText = campersData.length;
}

// ===================== دوال التحكم =====================
function addEmptyRow() {
    campersData.push({ name: "", dob: "", supervisor: "", supervisorPhone: "" });
    renderTable();
    autoSave();
}

function deleteAllRows() {
    if (confirm("⚠️ حذف جميع البيانات؟")) {
        campersData = [];
        renderTable();
        autoSave();
    }
}

async function generateAllQRs() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات");
        return;
    }
    showProgress(true, "جاري إنشاء QR بجودة 500×500...", 0);
    for (let i = 0; i < campersData.length; i++) {
        const percent = Math.round((i / campersData.length) * 100);
        showProgress(true, `جاري إنشاء QR ${i+1}/${campersData.length}`, percent);
        await generateSingleQR(i, campersData[i]);
        await new Promise(r => setTimeout(r, 50));
    }
    showProgress(false);
    alert("✅ تم إنشاء جميع أكواد QR بجودة عالية (500×500)!");
}

async function downloadAllQRCodes() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات");
        return;
    }
    showProgress(true, "جاري تجهيز الأكواد...", 0);
    for (let i = 0; i < campersData.length; i++) {
        const percent = Math.round((i / campersData.length) * 100);
        showProgress(true, `جاري تجهيز QR ${i+1}`, percent);
        const qrDiv = document.getElementById(`qrContainer_${i}`);
        if (!qrDiv?.querySelector('canvas')) {
            await generateSingleQR(i, campersData[i]);
        }
        await new Promise(r => setTimeout(r, 50));
    }
    for (let i = 0; i < campersData.length; i++) {
        const camper = campersData[i];
        let name = sanitizeFileName(camper.name) || `مصطاف_${i+1}`;
        downloadQRImageFromCanvas(`qrContainer_${i}`, name);
        await new Promise(r => setTimeout(r, 200));
    }
    showProgress(false);
    alert("✅ تم تحميل جميع الأكواد بجودة 2000×2000!");
}

// ===================== دوال Excel مع دعم الترقيم =====================
function exportToExcel() {
    if (campersData.length === 0) {
        alert("لا توجد بيانات للتصدير");
        return;
    }
    
    const data = [["#", "اسم المصطاف", "تاريخ الميلاد", "المنشط المسؤول", "هاتف المنشط"]];
    
    campersData.forEach((camper, idx) => {
        data.push([
            idx + 1,
            camper.name || "",
            camper.dob || "",
            camper.supervisor || "",
            camper.supervisorPhone || ""
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{wch:8}, {wch:25}, {wch:15}, {wch:20}, {wch:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "بيانات المخيم");
    XLSX.writeFile(wb, `بيانات_${campData.name}_${new Date().toLocaleDateString('ar')}.xlsx`);
    alert("✅ تم التصدير بنجاح");
}

function importExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                
                const imported = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 4) continue;
                    
                    let nameIndex = 0;
                    let dobIndex = 1;
                    let supervisorIndex = 2;
                    let phoneIndex = 3;
                    
                    if (row.length >= 5 && !isNaN(parseFloat(row[0])) && isFinite(row[0])) {
                        nameIndex = 1;
                        dobIndex = 2;
                        supervisorIndex = 3;
                        phoneIndex = 4;
                    }
                    
                    const name = row[nameIndex]?.toString().trim() || "";
                    if (name && name !== "") {
                        let dobValue = row[dobIndex] ? row[dobIndex].toString() : "";
                        dobValue = convertToEnglishNumbers(dobValue);
                        imported.push({
                            name: name,
                            dob: dobValue,
                            supervisor: row[supervisorIndex]?.toString().trim() || "",
                            supervisorPhone: row[phoneIndex]?.toString().trim() || ""
                        });
                    }
                }
                
                if (imported.length === 0) {
                    reject(new Error("لم يتم العثور على بيانات في الملف"));
                }
                resolve(imported);
            } catch (err) { 
                reject(err); 
            }
        };
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsArrayBuffer(file);
    });
}

// ===================== الواجهة =====================
function loadCampDataToUI() {
    document.getElementById("campNameHeader").innerText = campData.name;
    const logo = document.getElementById("campLogoImg");
    if (campData.logo) {
        logo.src = campData.logo;
        logo.style.display = "inline-block";
    } else logo.style.display = "none";
    document.getElementById("campDetailsDisplay").innerHTML = `🏕️ ${campData.name} | مدير: ${campData.manager} | 📞 ${campData.phone}`;
}

function applySettings() {
    document.getElementById("qrMainTitle").style.fontSize = fontSize + "px";
    if (backgroundImage) mainAppDiv.style.backgroundImage = `url('${backgroundImage}')`;
    document.getElementById("fontRange").value = fontSize;
}

function logout() {
    if (currentUser) autoSave();
    currentUser = null;
    loginScreen.style.display = "flex";
    mainAppDiv.style.display = "none";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").innerText = "";
}

// ===================== الحسابات =====================
function addSubAccount(name, username, pass, role) {
    const subs = getSubAccounts();
    if (subs.find(a => a.username === username)) {
        alert("⚠️ اسم المستخدم موجود");
        return false;
    }
    subs.push({ username, password: pass, fullName: name, role, isMain: false, createdAt: new Date().toISOString() });
    saveSubAccounts(subs);
    alert(`✅ تم الإضافة\nاسم المستخدم: ${username}\nكلمة المرور: ${pass}`);
    return true;
}

function deleteSubAccount(username) {
    let subs = getSubAccounts();
    const idx = subs.findIndex(a => a.username === username);
    if (idx !== -1) {
        subs.splice(idx, 1);
        saveSubAccounts(subs);
        localStorage.removeItem(`userData_${username}`);
        alert("✅ تم الحذف");
        return true;
    }
    return false;
}

function showAllSubAccounts() {
    const subs = getSubAccounts();
    const container = document.getElementById("accountsList");
    if (!subs.length) {
        container.innerHTML = '<p style="text-align:center">📭 لا يوجد حسابات</p>';
    } else {
        container.innerHTML = "";
        subs.forEach(acc => {
            const div = document.createElement("div");
            div.className = "account-item";
            div.innerHTML = `
                <h4>👤 ${acc.fullName}</h4>
                <p>📧 ${acc.username}</p>
                <p>🔑 ${acc.password}</p>
                <p>🎭 ${acc.role}</p>
                <button class="delete-account-btn" data-user="${acc.username}">🗑️ حذف</button>
            `;
            div.querySelector(".delete-account-btn").onclick = () => {
                if (confirm(`حذف ${acc.fullName}؟`)) {
                    deleteSubAccount(acc.username);
                    showAllSubAccounts();
                }
            };
            container.appendChild(div);
        });
    }
    document.getElementById("listAccountsModal").style.display = "flex";
}

function login(username, pass) {
    if (username === MAIN_ACCOUNT.username && pass === MAIN_ACCOUNT.password) {
        currentUser = MAIN_ACCOUNT;
        return true;
    }
    const sub = getSubAccounts().find(a => a.username === username && a.password === pass);
    if (sub) { currentUser = sub; return true; }
    return false;
}

// ===================== تهيئة شريط البحث =====================
function initSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        // إزالة المستمع القديم إذا وجد
        const oldInput = searchInput;
        const newInput = oldInput.cloneNode(true);
        oldInput.parentNode.replaceChild(newInput, oldInput);
        
        // إضافة المستمع الجديد
        newInput.addEventListener("input", filterTable);
        document.getElementById("searchInput");
    }
    
    const clearBtn = document.getElementById("clearSearchBtn");
    if (clearBtn) {
        const oldBtn = clearBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        
        newBtn.addEventListener("click", function() {
            const input = document.getElementById("searchInput");
            if (input) {
                input.value = "";
                filterTable();
            }
        });
    }
}

// ===================== الأحداث =====================
document.getElementById("doLoginBtn").onclick = () => {
    const user = document.getElementById("loginUsername").value.trim();
    const pass = document.getElementById("loginPassword").value;
    if (!user || !pass) {
        document.getElementById("loginError").innerText = "❌ أدخل البيانات";
        return;
    }
    if (login(user, pass)) {
        const data = loadUserData(currentUser.username);
        campersData = data.campers || [];
        campData = data.campInfo || { name: "مخيم الأمل", manager: "غير محدد", phone: "---", logo: "" };
        loginScreen.style.display = "none";
        mainAppDiv.style.display = "block";
        loadCampDataToUI();
        renderTable();
        applySettings();
        // تهيئة البحث بعد تحميل التطبيق
        setTimeout(initSearch, 100);
        setTimeout(() => alert(`👋 مرحباً ${currentUser.fullName}`), 100);
    } else {
        document.getElementById("loginError").innerText = "❌ خطأ في البيانات";
    }
};

document.getElementById("loginPassword").addEventListener("keypress", e => { if(e.key === "Enter") document.getElementById("doLoginBtn").click(); });

document.getElementById("fillFormBtn").onclick = addEmptyRow;
document.getElementById("deleteAllRowsBtn").onclick = deleteAllRows;
document.getElementById("generateQRBtn").onclick = generateAllQRs;
document.getElementById("downloadAllQrBtn").onclick = downloadAllQRCodes;
document.getElementById("exportExcelBtn").onclick = exportToExcel;
document.getElementById("logoutBtn").onclick = logout;

document.getElementById("importExcelBtn").onclick = () => document.getElementById("importExcelModal").style.display = "flex";
document.getElementById("confirmImportBtn").onclick = async () => {
    const file = document.getElementById("excelFileInput").files[0];
    if (!file) { alert("اختر ملف"); return; }
    showProgress(true, "جاري الاستيراد...", 0);
    try {
        const imported = await importExcel(file);
        if (imported.length) {
            campersData.push(...imported);
            renderTable();
            autoSave();
            alert(`✅ تم استيراد ${imported.length} سجل بنجاح`);
        } else {
            alert("⚠️ لا توجد بيانات للاستيراد");
        }
    } catch(e) { 
        alert("خطأ في الاستيراد: " + e.message); 
    }
    showProgress(false);
    document.getElementById("importExcelModal").style.display = "none";
    document.getElementById("excelFileInput").value = "";
};
document.getElementById("closeImportModal").onclick = () => document.getElementById("importExcelModal").style.display = "none";

document.getElementById("settingsMainBtn").onclick = () => document.getElementById("settingsModal").style.display = "flex";
document.getElementById("closeSettings").onclick = () => document.getElementById("settingsModal").style.display = "none";
document.getElementById("fontRange").oninput = function(e) {
    fontSize = e.target.value;
    localStorage.setItem("titleFontSize", fontSize);
    document.getElementById("qrMainTitle").style.fontSize = fontSize + "px";
};
document.getElementById("bgImageUpload").onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            backgroundImage = ev.target.result;
            localStorage.setItem("bgImage", backgroundImage);
            mainAppDiv.style.backgroundImage = `url('${backgroundImage}')`;
        };
        reader.readAsDataURL(file);
    }
};
document.getElementById("fullscreenToggle").onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
};

document.getElementById("addSubAccountBtn").onclick = () => {
    if (currentUser?.username === MAIN_ACCOUNT.username) document.getElementById("subAccountModal").style.display = "flex";
    else alert("⚠️ فقط المدير العام");
};
document.getElementById("saveSubAccountBtn").onclick = () => {
    const name = document.getElementById("subName").value.trim();
    const user = document.getElementById("subUsername").value.trim();
    const pass = document.getElementById("subPassword").value;
    const confirm = document.getElementById("subConfirmPassword").value;
    const role = document.getElementById("subRole").value;
    if (!name || !user || !pass) { alert("املأ الحقول"); return; }
    if (pass !== confirm) { alert("كلمة المرور غير متطابقة"); return; }
    if (pass.length < 4) { alert("كلمة المرور 4 أحرف على الأقل"); return; }
    addSubAccount(name, user, pass, role);
    document.getElementById("subAccountModal").style.display = "none";
    ["subName", "subUsername", "subPassword", "subConfirmPassword"].forEach(id => document.getElementById(id).value = "");
};
document.getElementById("listSubAccountsBtn").onclick = () => {
    if (currentUser?.username === MAIN_ACCOUNT.username) showAllSubAccounts();
    else alert("⚠️ فقط المدير العام");
};
document.getElementById("closeSubModal").onclick = () => document.getElementById("subAccountModal").style.display = "none";
document.getElementById("closeListModal").onclick = () => document.getElementById("listAccountsModal").style.display = "none";

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
        reader.onload = e => { campData.logo = e.target.result; autoSave(); loadCampDataToUI(); };
        reader.readAsDataURL(logoFile);
    } else { autoSave(); loadCampDataToUI(); }
    document.getElementById("campInfoModal").style.display = "none";
};
document.getElementById("closeCampModal").onclick = () => document.getElementById("campInfoModal").style.display = "none";

// التحميل الأولي
applySettings();
if (!localStorage.getItem("subAccounts")) localStorage.setItem("subAccounts", "[]");

window.addEventListener("beforeunload", () => { if (currentUser) autoSave(); });