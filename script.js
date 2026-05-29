(function() {
    // ===================== البيانات الأساسية =====================
    let mainAccount = { username: "bilalayeb1996", password: "bilalayeb1996" };
    let subAccounts = JSON.parse(localStorage.getItem("subAccounts")) || [];
    let currentUser = null;
    let isMain = false;
    let campData = JSON.parse(localStorage.getItem("campData")) || { 
        name: "مخيم الأمل", 
        manager: "غير محدد", 
        phone: "---", 
        logo: "" 
    };
    let fontSize = localStorage.getItem("titleFontSize") || 40;
    let backgroundImage = localStorage.getItem("bgImage") || "";
    let campersData = JSON.parse(localStorage.getItem("campersData")) || [];

    // ===================== عناصر DOM =====================
    const loginScreen = document.getElementById("loginScreen");
    const mainAppDiv = document.getElementById("mainApp");
    const tableBody = document.getElementById("tableBody");

    // ===================== دوال الحفظ =====================
    function saveCampersToLocal() { 
        localStorage.setItem("campersData", JSON.stringify(campersData)); 
        updateStats();
    }
    
    function saveAllData() {
        localStorage.setItem("campData", JSON.stringify(campData));
        localStorage.setItem("titleFontSize", fontSize);
        localStorage.setItem("bgImage", backgroundImage);
        saveCampersToLocal();
        localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
    }
    
    function updateStats() {
        const countSpan = document.getElementById("campersCount");
        if (countSpan) countSpan.innerText = campersData.length;
    }

    // ===================== دوال مساعدة =====================
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
    
    // ===================== إنشاء QR (مستقر تماماً) =====================
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
            
            // تنظيف الحاوية بشكل كامل
            qrContainer.innerHTML = "";
            qrContainer.className = "qr-container";
            
            // إنشاء عنصر canvas
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100;
            qrContainer.appendChild(canvas);
            
            // إنشاء QR باستخدام المكتبة الجديدة
            QRCode.toCanvas(canvas, qrText, {
                width: 100,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) {
                    console.error("خطأ في إنشاء QR:", error);
                    qrContainer.innerHTML = '<div class="qr-placeholder">❌ خطأ</div>';
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }
    
    // ===================== تحميل QR =====================
    function downloadQRImageFromCanvas(containerId, fileName) {
        const container = document.getElementById(containerId);
        if (!container) { 
            alert("خطأ في العنصر"); 
            return false; 
        }
        
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
            console.error(e); 
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
            row.setAttribute("data-idx", idx);
            row.innerHTML = `
                <td><input type="text" class="name-input" value="${escapeHtml(camper.name)}" placeholder="الاسم الكامل"></td>
                <td><input type="date" class="dob-input" value="${camper.dob || ""}"></td>
                <td><input type="text" class="supervisor-input" value="${escapeHtml(camper.supervisor)}" placeholder="اسم المنشط"></td>
                <td><input type="tel" class="supervisor-phone" value="${escapeHtml(camper.supervisorPhone)}" placeholder="رقم الهاتف"></td>
                <td class="qr-cell"><div id="qrContainer_${idx}" class="qr-container qr-placeholder">🔄 انتظر الإنشاء</div></td>
                <td><button class="download-qr-btn" data-idx="${idx}">📸 تحميل QR</button></td>
                <td><button class="delete-row-btn" data-idx="${idx}">🗑️ حذف</button></td>
            `;
            
            // ربط أحداث التعديل
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
                saveCampersToLocal();
            };
            
            nameInp.addEventListener("input", updateCamper);
            dobInp.addEventListener("change", updateCamper);
            supInp.addEventListener("input", updateCamper);
            phoneInp.addEventListener("input", updateCamper);
            
            // حذف الصف
            row.querySelector(".delete-row-btn").addEventListener("click", () => {
                if (confirm("حذف هذا الشخص؟")) {
                    campersData.splice(idx, 1);
                    saveCampersToLocal();
                    renderTable();
                }
            });
            
            // تحميل QR
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
    
    // ===================== دوال التحكم =====================
    function addEmptyRow() {
        campersData.push({ name: "", dob: "", supervisor: "", supervisorPhone: "" });
        saveCampersToLocal();
        renderTable();
    }
    
    function deleteAllRows() {
        if (!isMain && currentUser !== "bilalayeb1996") {
            alert("⚠️ غير مسموح! الحسابات الفرعية لا تملك صلاحية حذف الكل");
            return;
        }
        
        if (confirm("⚠️ هل أنت متأكد من حذف جميع بيانات المصطافين؟")) {
            campersData = [];
            saveCampersToLocal();
            renderTable();
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
        
        // التأكد من وجود جميع الأكواد
        for (let i = 0; i < campersData.length; i++) {
            const qrDiv = document.getElementById(`qrContainer_${i}`);
            const percent = Math.round((i / campersData.length) * 100);
            showProgress(true, `جاري تجهيز QR رقم ${i+1}`, percent);
            
            if (!qrDiv || !qrDiv.querySelector('canvas')) {
                await generateSingleQR(i, campersData[i]);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // تحميل الملفات
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
        saveAllData();
        currentUser = null;
        isMain = false;
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
    
    // ===================== أحداث تسجيل الدخول =====================
    document.getElementById("doLoginBtn").onclick = function() {
        const user = document.getElementById("loginUsername").value.trim();
        const pass = document.getElementById("loginPassword").value.trim();
        
        // التحقق من الحساب الرئيسي
        if (user === mainAccount.username && pass === mainAccount.password) {
            currentUser = user;
            isMain = true;
            loginScreen.style.display = "none";
            mainAppDiv.style.display = "block";
            loadCampDataToUI();
            renderTable();
            applySettings();
            setupSearch();
        } else {
            // التحقق من الحسابات الفرعية (باستخدام البريد الإلكتروني كاسم مستخدم)
            const found = subAccounts.find(acc => acc.username === user && acc.password === pass);
            if (found) {
                currentUser = user;
                isMain = false;
                loginScreen.style.display = "none";
                mainAppDiv.style.display = "block";
                loadCampDataToUI();
                renderTable();
                applySettings();
                setupSearch();
                // إظهار رسالة ترحيب بالحساب الفرعي
                setTimeout(() => {
                    alert(`👋 مرحباً ${found.fullName || user}\n🎭 الدور: ${found.role}\n📧 البريد الإلكتروني: ${user}`);
                }, 100);
            } else { 
                document.getElementById("loginError").innerText = "❌ اسم المستخدم أو كلمة المرور غير صحيحة"; 
            }
        }
    };
    
    // ===================== أزرار التحكم الرئيسية =====================
    document.getElementById("fillFormBtn").onclick = () => addEmptyRow();
    document.getElementById("deleteAllRowsBtn").onclick = () => deleteAllRows();
    document.getElementById("generateQRBtn").onclick = () => generateAllQRs();
    document.getElementById("downloadAllQrBtn").onclick = () => downloadAllQRCodes();
    document.getElementById("exportExcelBtn").onclick = () => exportToExcel();
    document.getElementById("logoutBtn").onclick = () => logout();
    
    // ===================== الإعدادات =====================
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
    
    // ===================== الحسابات الفرعية (محدث) =====================
    document.getElementById("addSubAccountBtn").onclick = function() {
        if (!isMain) { 
            alert("⚠️ الحسابات الفرعية لا تملك صلاحية إضافة حسابات"); 
            return; 
        }
        document.getElementById("subAccountModal").style.display = "flex";
    };
    
    document.getElementById("saveSubAccountBtn").onclick = function() {
        const fullName = document.getElementById("subName").value.trim();
        const role = document.getElementById("subRole").value;
        const email = document.getElementById("subEmail").value.trim();
        const pass = document.getElementById("subPass").value;
        const confirmPass = document.getElementById("subConfirmPass").value;
        
        // التحقق من البريد الإلكتروني
        if (!email || !pass) { 
            alert("⚠️ البريد الإلكتروني والرقم السري مطلوبان"); 
            return; 
        }
        
        if (!fullName) {
            alert("⚠️ الرجاء إدخال الاسم واللقب");
            return;
        }
        
        // التحقق من تطابق الرقم السري
        if (pass !== confirmPass) {
            alert("⚠️ الرقم السري وتأكيد الرقم السري غير متطابقين!");
            return;
        }
        
        // التحقق من طول الرقم السري
        if (pass.length < 4) {
            alert("⚠️ الرقم السري يجب أن يكون 4 أحرف على الأقل");
            return;
        }
        
        // التحقق من صيغة البريد الإلكتروني
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("⚠️ الرجاء إدخال بريد إلكتروني صحيح (مثال: name@domain.com)");
            return;
        }
        
        // التحقق من عدم وجود البريد مسبقاً
        const existingAccount = subAccounts.find(acc => acc.username === email);
        if (existingAccount) {
            alert("⚠️ هذا البريد الإلكتروني مستخدم بالفعل!");
            return;
        }
        
        // إضافة الحساب مع استخدام البريد الإلكتروني كاسم مستخدم
        subAccounts.push({ 
            username: email,        // البريد الإلكتروني هو اسم المستخدم لتسجيل الدخول
            password: pass,         // الرقم السري المستخدم لتسجيل الدخول
            role: role, 
            email: email,
            fullName: fullName
        });
        
        localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
        
        // عرض معلومات الحساب للمستخدم
        alert(`✅ تم إنشاء الحساب بنجاح!

┌─────────────────────────────
│ 📧 البريد الإلكتروني (اسم المستخدم): ${email}
│ 🔑 الرقم السري: ${pass}
│ 👤 الاسم: ${fullName}
│ 🎭 الدور: ${role}
└─────────────────────────────

📌 يمكن للحساب الجديد تسجيل الدخول باستخدام:
   البريد الإلكتروني: ${email}
   الرقم السري: ${pass}`);
        
        // تنظيف الحقول
        document.getElementById("subAccountModal").style.display = "none";
        document.getElementById("subName").value = "";
        document.getElementById("subPass").value = "";
        document.getElementById("subConfirmPass").value = "";
        document.getElementById("subEmail").value = "";
    };
    
    document.getElementById("listSubAccountsBtn").onclick = function() {
        if (!isMain) { 
            alert("⚠️ غير مسموح، هذه الخاصية للحساب الأساسي فقط"); 
            return; 
        }
        
        if (subAccounts.length === 0) {
            alert("📋 لا يوجد حسابات فرعية حالياً");
            return;
        }
        
        let list = "📋 قائمة الحسابات الفرعية:\n\n";
        subAccounts.forEach((acc, idx) => { 
            list += `${idx+1}. ┌─────────────────────\n`;
            list += `   │ 👤 الاسم: ${acc.fullName || acc.username}\n`;
            list += `   │ 📧 البريد: ${acc.email || acc.username}\n`;
            list += `   │ 🎭 الدور: ${acc.role}\n`;
            list += `   │ 🔑 الرقم السري: ${acc.password}\n`;
            list += `   └─────────────────────\n\n`;
        });
        
        const del = prompt(list + "\n✏️ أدخل رقم الحساب للحذف (أو إلغاء)");
        if (del && !isNaN(del) && del > 0 && del <= subAccounts.length) {
            const accountToDelete = subAccounts[del-1];
            if (confirm(`⚠️ هل تريد حذف حساب ${accountToDelete.fullName || accountToDelete.username}؟\n📧 البريد: ${accountToDelete.email}\n🎭 الدور: ${accountToDelete.role}`)) {
                subAccounts.splice(del-1, 1);
                localStorage.setItem("subAccounts", JSON.stringify(subAccounts));
                alert("✅ تم حذف الحساب بنجاح");
            }
        }
    };
    
    document.getElementById("closeSubModal").onclick = () => {
        document.getElementById("subAccountModal").style.display = "none";
        // تنظيف الحقول
        document.getElementById("subName").value = "";
        document.getElementById("subPass").value = "";
        document.getElementById("subConfirmPass").value = "";
        document.getElementById("subEmail").value = "";
    };
    
    // ===================== معلومات المخيم =====================
    document.getElementById("addCampInfoBtn").onclick = () => {
        document.getElementById("campInfoModal").style.display = "flex";
        document.getElementById("campName").value = campData.name;
        document.getElementById("campManager").value = campData.manager;
        document.getElementById("campPhone").value = campData.phone;
    };
    
    document.getElementById("saveCampInfoBtn").onclick = function() {
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
                localStorage.setItem("campData", JSON.stringify(campData)); 
                loadCampDataToUI(); 
                saveAllData();
                if (campersData.length > 0) {
                    setTimeout(() => generateAllQRs(), 500);
                }
            };
            reader.readAsDataURL(logoFile);
        } else {
            localStorage.setItem("campData", JSON.stringify(campData));
            loadCampDataToUI();
            saveAllData();
            if (campersData.length > 0) {
                generateAllQRs();
            }
        }
        
        document.getElementById("campInfoModal").style.display = "none";
    };
    
    document.getElementById("closeCampModal").onclick = () => document.getElementById("campInfoModal").style.display = "none";
    
    // الضغط على Enter في شاشة تسجيل الدخول
    document.getElementById("loginPassword").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            document.getElementById("doLoginBtn").click();
        }
    });
    
    // ===================== التحميل الأولي =====================
    loadCampDataToUI();
    renderTable();
    applySettings();
    if (backgroundImage) mainAppDiv.style.backgroundImage = `url('${backgroundImage}')`;
    
    // منع إغلاق الصفحة أثناء العمليات
    window.addEventListener("beforeunload", (e) => {
        if (campersData.length > 0) {
            e.preventDefault();
            e.returnValue = "⚠️ هل أنت متأكد من مغادرة الصفحة؟ قد تفقد البيانات غير المحفوظة.";
        }
    });
})();