const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const subjects = ["ریاضی","علوم تجربی","فارسی","نگارش","عربی","زبان انگلیسی","مطالعات اجتماعی","پیام‌های آسمان","قرآن","تفکر و سبک زندگی","کار و فناوری","فرهنگ و هنر"];
function openModal(title, html){ modalTitle.textContent=title; modalBody.innerHTML=html; modal.classList.remove("hidden"); }
function closeModal(){modal.classList.add("hidden")}
document.getElementById("closeModal").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",()=>openSection(el.dataset.open)));
function openSection(key){
 if(key==="subjects"){
  openModal("کتاب‌های پایه هشتم",`<div class="subject-list">${subjects.map((s,i)=>`<button class="subject" data-subject="${s}">${["➗","🔬","📘","✍️","🌙","🔤","🌍","🕌","📖","💡","🛠️","🎨"][i]} ${s}<small>مشاهده درس‌ها و فصل‌ها</small></button>`).join("")}</div><p class="muted">محتوای آموزشی اختصاصی هر درس در مرحله بعد اضافه می‌شود.</p>`);
  modalBody.querySelectorAll("[data-subject]").forEach(b=>b.onclick=()=>openModal(b.dataset.subject,`<p class="muted">بخش ${b.dataset.subject} آماده دریافت محتوای اختصاصی است. در نسخه بعد فصل‌ها، آموزش‌ها، تمرین‌ها و جزوه‌ها به این قسمت متصل می‌شوند.</p>`));
 } else if(key==="tutor"){
  openModal("معلم هوشمند خردیار",`<div class="chat-box"><div class="chat-log" id="chatLog">سلام! من معلم هوشمند خردیارم 🌱<br>سؤالت رو بنویس یا عکس تمرینت رو بفرست تا مرحله‌به‌مرحله کمکت کنم.</div><div class="chat-input"><input id="question" placeholder="سؤالت رو اینجا بنویس..."><button class="primary" id="send">ارسال</button></div><label class="upload">📷 انتخاب عکس سؤال<input id="image" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><div id="fileName" class="muted"></div></div>`);
  document.getElementById("image").onchange=e=>document.getElementById("fileName").textContent=e.target.files[0]?.name||"";
  document.getElementById("send").onclick=sendQuestion;
  document.getElementById("question").onkeydown=e=>{if(e.key==="Enter")sendQuestion()};
 } else if(key==="quiz"){
  openModal("آزمون کوتاه ریاضی",`<div class="quiz-question"><b>سؤال نمونه</b><br>حاصل عبارت ۳ × (۴ + ۲) کدام است؟</div>${["۱۲","۱۴","۱۸","۲۴"].map((x,i)=>`<button class="answer" data-answer="${i}">${["الف","ب","ج","د"][i]}) ${x}</button>`).join("")}<p id="quizResult" class="muted">یک گزینه را انتخاب کن.</p>`);
  modalBody.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>{document.getElementById("quizResult").textContent=Number(b.dataset.answer)===2?"آفرین! پاسخ درست است 🎉":"این گزینه درست نیست؛ دوباره فکر کن و تلاش کن.";});
 } else if(key==="notes"){
  openModal("جزوه و خلاصه‌ها",`<p class="muted">خلاصه‌های اختصاصی فصل‌ها، نکته‌های امتحانی و فلش‌کارت‌ها در این بخش قرار می‌گیرند.</p><div class="subject-list">${subjects.slice(0,6).map(s=>`<div class="subject">${s}<small>به‌زودی اضافه می‌شود</small></div>`).join("")}</div>`);
 }
}
async function sendQuestion(){
 const input=document.getElementById("question"), fileInput=document.getElementById("image"), log=document.getElementById("chatLog");
 const question=input.value.trim(), file=fileInput.files[0];
 if(!question&&!file){log.textContent+="\n\nاول سؤال یا عکس تمرینت رو وارد کن.";return}
 const form=new FormData(); form.append("question",question); if(file)form.append("image",file);
 if(tg?.initData)form.append("initData",tg.initData);
 log.textContent+="\n\nتو: "+(question||"عکس سؤال ارسال شد")+"\nخردیار: در حال بررسی سؤال...";
 input.value="";
 try{
  const r=await fetch("/api/chat",{method:"POST",body:form}); const data=await r.json();
  log.textContent+="\n"+(data.answer||data.error||"پاسخی دریافت نشد.");
 }catch(e){log.textContent+="\nارتباط با سرور برقرار نشد. تنظیمات سرور را بررسی کن."}
 fileInput.value="";document.getElementById("fileName").textContent="";
}
document.getElementById("profileBtn").onclick=()=>openModal("پروفایل دانش‌آموز","<p class='muted'>پروفایل، امتیازها و گزارش پیشرفت در نسخه بعد فعال می‌شود.</p>");
document.getElementById("navProfile").onclick=()=>openModal("پروفایل دانش‌آموز","<p class='muted'>پروفایل، امتیازها و گزارش پیشرفت در نسخه بعد فعال می‌شود.</p>");
