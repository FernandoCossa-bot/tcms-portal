// Presentation preferences only. Never used to decide authorization.
(() => {
  const read=(k,d)=>{try{return localStorage.getItem(k)||d;}catch{return d;}};
  const save=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
  let theme=read('tcms-theme','system'), lang=read('tcms-language','en');
  if(!['light','dark','system'].includes(theme))theme='system';
  if(!['en','pt','zh-Hant'].includes(lang))lang='en';
  const media=matchMedia('(prefers-color-scheme: dark)');
  const dictionary={
"Inventory & Movements":["Inventário e Movimentos", "庫存與異動"],"Inventory and movements":["Inventário e movimentos", "庫存與異動"],"LOGISTICS & WAREHOUSE":["LOGÍSTICA E ARMAZÉM", "物流與倉儲"],"Manage inventory and stock movements.":["Gerir o inventário e os movimentos de stock.", "管理庫存及出入庫紀錄。"],"Inventory access":["Acesso ao inventário", "庫存模組存取權"],"Inventory available":["Inventário disponível", "庫存模組可用"],"Transport, inventory and stock movements.":["Transporte, inventário e movimentos de stock.", "運輸、庫存及出入庫紀錄。"],"Open transportation":["Abrir transportes", "開啟運輸"],"Checking inventory access…":["A verificar o acesso ao inventário…", "正在檢查庫存存取權…"],"Inventory access is not assigned.":["O acesso ao inventário não foi atribuído.", "尚未授予庫存存取權。"],"Logistics is temporarily unavailable.":["A logística está temporariamente indisponível.", "物流模組暫時無法使用。"],"This operation is not permitted.":["Esta operação não é permitida.", "不允許此操作。"],"Record changed. Refresh and review again.":["O registo foi alterado. Atualize e reveja novamente.", "紀錄已變更，請重新整理並檢查。"],"Access status: {status}":["Estado do acesso: {status}", "存取狀態：{status}"],"Inventory role: {role}":["Função no inventário: {role}", "庫存角色：{role}"],"Reason for access":["Motivo do pedido de acesso", "申請存取原因"],"Request inventory access":["Solicitar acesso ao inventário", "申請庫存存取權"],"Access request submitted. Wait for the module administrator.":["Pedido enviado. Aguarde a aprovação do administrador do módulo.", "申請已送出，請等候模組管理員核准。"],"Current stock":["Stock atual", "目前庫存"],"Stock movements":["Movimentos de stock", "庫存異動"],"Item":["Artigo", "品項"],"Item name":["Nome do artigo", "品項名稱"],"Quantity":["Quantidade", "數量"],"No items yet.":["Ainda não existem artigos.", "尚無品項。"],"Add item":["Adicionar artigo", "新增品項"],"Save item":["Guardar artigo", "儲存品項"],"Item saved.":["Artigo guardado.", "品項已儲存。"],"Showing up to 500 recent movements.":["A mostrar até 500 movimentos recentes.", "顯示最近最多500筆異動。"],"Movement type":["Tipo de movimento", "異動類型"],"Correct movement":["Corrigir movimento", "修正異動"],"Correct quantity":["Corrigir quantidade", "修正數量"],"Save correction":["Guardar correção", "儲存修正"],"Record movement":["Registar movimento", "登記異動"],"Save movement":["Guardar movimento", "儲存異動"],"Movement saved.":["Movimento guardado.", "異動已儲存。"],"Inventory access management":["Gestão de acessos ao inventário", "庫存權限管理"],"Protected System Owner":["Proprietário do sistema protegido", "受保護的系統擁有者"],"Review access":["Rever acesso", "審核存取權"],"Review inventory access":["Rever acesso ao inventário", "審核庫存存取權"],"Assign module access":["Atribuir acesso ao módulo", "授予模組存取權"],"Decision":["Decisão", "決定"],"Revoke":["Revogar", "撤銷"],"Save access":["Guardar acesso", "儲存權限"],"Save inventory access for {name}?":["Guardar o acesso ao inventário de {name}?", "儲存{name}的庫存權限？"],"Access decision saved.":["Decisão de acesso guardada.", "存取權決定已儲存。"],"Manage inventory access":["Gerir acessos ao inventário", "管理庫存存取權"],"Inventory audit history":["Histórico de auditoria do inventário", "庫存稽核紀錄"],"Actor":["Responsável", "操作者"],"Target":["Destino", "目標"],"IN":["Entrada", "入庫"],"OUT":["Saída", "出庫"],"VIEWER":["Consulta", "檢視者"],"OPERATOR":["Operador", "操作員"],"MANAGER":["Gestor", "主管"],"ADMIN":["Administrador", "管理員"],
  "YOUR WORKSPACE": [
    "O SEU ESPAÇO DE TRABALHO",
    "您的工作空間"
  ],
  "Welcome back.": [
    "Bem-vindo de volta.",
    "歡迎回來。"
  ],
  "Where would you like to work today?": [
    "Onde pretende trabalhar hoje?",
    "今天您想在哪個模組工作？"
  ],
  "Choose a module to continue.": [
    "Escolha um módulo para continuar.",
    "選擇模組以繼續。"
  ],
  "TCMS modules": [
    "Módulos TCMS",
    "TCMS 模組"
  ],
  "Four business areas · one shared identity": [
    "Quatro áreas · uma identidade partilhada",
    "四個業務領域 · 共用身分"
  ],
  "Information Management System": [
    "Sistema de Gestão de Informação",
    "資訊管理系統"
  ],
  "Education & Vocational Training": [
    "Educação e Formação Profissional",
    "教育與職業培訓"
  ],
  "Farm Management": [
    "Gestão Agrícola",
    "農場管理"
  ],
  "Logistics & Warehouse": [
    "Logística e Armazém",
    "物流與倉儲"
  ],
  "Activities, records and shared information.": [
    "Atividades, registos e informação partilhada.",
    "活動、紀錄與共用資訊。"
  ],
  "Learning, sessions and attendance.": [
    "Formação, sessões e presenças.",
    "學習、課程與出席紀錄。"
  ],
  "Production, resources and field operations.": [
    "Produção, recursos e operações agrícolas.",
    "生產、資源與農務作業。"
  ],
  "Transport, inventory and distribution.": [
    "Transporte, inventário e distribuição.",
    "運輸、庫存與配送。"
  ],
  "Open module →": [
    "Abrir módulo →",
    "開啟模組 →"
  ],
  "Unavailable": [
    "Indisponível",
    "尚未開放"
  ],
  "IMS available": [
    "IMS disponível",
    "IMS 可使用"
  ],
  "Transportation available": [
    "Transporte disponível",
    "運輸可使用"
  ],
  "Access not assigned": [
    "Acesso não atribuído",
    "尚未授予權限"
  ],
  "Integration pending": [
    "Integração pendente",
    "等待整合"
  ],
  "System Administration": [
    "Administração do Sistema",
    "系統管理"
  ],
  "Human Resources": [
    "Recursos Humanos",
    "人力資源"
  ],
  "Manage people, permissions and platform access.": [
    "Gerir utilizadores, permissões e acesso à plataforma.",
    "管理使用者、權限與平台存取。"
  ],
  "Create staff accounts and maintain employee details.": [
    "Criar contas e manter os dados dos colaboradores.",
    "建立員工帳號並維護員工資料。"
  ],
  "Check access": [
    "Verificar acesso",
    "檢查權限"
  ],
  "Sign out": [
    "Terminar sessão",
    "登出"
  ],
  "Your account is active.": [
    "A sua conta está ativa.",
    "您的帳號已啟用。"
  ],
  "Checking access…": [
    "A verificar acesso…",
    "正在檢查權限…"
  ],
  "Loading permissions…": [
    "A carregar permissões…",
    "正在載入權限…"
  ],
  "My account settings": [
    "Definições da minha conta",
    "我的帳號設定"
  ],
  "My account": [
    "A minha conta",
    "我的帳號"
  ],
  "Display name": [
    "Nome apresentado",
    "顯示名稱"
  ],
  "Save name": [
    "Guardar nome",
    "儲存名稱"
  ],
  "Your name was saved.": [
    "O seu nome foi guardado.",
    "名稱已儲存。"
  ],
  "WELCOME TO TCMS": [
    "BEM-VINDO AO TCMS",
    "歡迎使用 TCMS"
  ],
  "Sign in to access your authorized workspace.": [
    "Inicie sessão para aceder ao seu espaço de trabalho.",
    "登入以使用您獲授權的工作空間。"
  ],
  "Account credentials": [
    "Credenciais da conta",
    "帳號憑證"
  ],
  "Email address": [
    "Endereço de email",
    "電子郵件地址"
  ],
  "Password": [
    "Palavra-passe",
    "密碼"
  ],
  "Sign in securely": [
    "Iniciar sessão",
    "安全登入"
  ],
  "Need an account? Contact Human Resources.": [
    "Precisa de uma conta? Contacte os Recursos Humanos.",
    "需要帳號？請聯絡人力資源部門。"
  ],
  "Connecting to TCMS…": [
    "A ligar ao TCMS…",
    "正在連線至 TCMS…"
  ],
  "Enter your email address and password.": [
    "Introduza o seu email e a palavra-passe.",
    "請輸入電子郵件地址與密碼。"
  ],
  "Skip to main content": [
    "Saltar para o conteúdo principal",
    "跳至主要內容"
  ],
  "Connected teams.": [
    "Equipas conectadas.",
    "團隊緊密連結。"
  ],
  "Meaningful impact.": [
    "Impacto com propósito.",
    "創造有意義的影響。"
  ],
  "One platform": [
    "Uma plataforma",
    "單一平台"
  ],
  "Purposeful collaboration": [
    "Colaboração com propósito",
    "有目標的協作"
  ],
  "A shared workspace for the people supporting our daily operations.": [
    "Um espaço partilhado para quem apoia as nossas operações diárias.",
    "為支援日常營運的同仁提供共用工作空間。"
  ],
  "Back to home": [
    "Voltar ao início",
    "返回首頁"
  ],
  "Back to modules": [
    "Voltar aos módulos",
    "返回模組"
  ],
  "Request IMS access": [
    "Solicitar acesso ao IMS",
    "申請 IMS 權限"
  ],
  "Submit request": [
    "Enviar pedido",
    "提交申請"
  ],
  "Reason for access": [
    "Motivo do acesso",
    "申請原因"
  ],
  "Change password": [
    "Alterar palavra-passe",
    "變更密碼"
  ],
  "New password": [
    "Nova palavra-passe",
    "新密碼"
  ],
  "Confirm new password": [
    "Confirmar nova palavra-passe",
    "確認新密碼"
  ],
  "SECURE YOUR ACCOUNT": [
    "PROTEJA A SUA CONTA",
    "保護您的帳號"
  ],
  "Choose your personal password": [
    "Escolha a sua palavra-passe pessoal",
    "設定您的個人密碼"
  ],
  "Replace your initial password to continue to your modules.": [
    "Substitua a palavra-passe inicial para continuar para os módulos.",
    "請更換初始密碼以繼續使用模組。"
  ],
  "Use at least 12 characters and a password you do not use elsewhere.": [
    "Use pelo menos 12 caracteres e uma palavra-passe que não utilize noutros serviços.",
    "請使用至少 12 個字元，且未在其他服務使用的密碼。"
  ],
  "Save password and continue": [
    "Guardar palavra-passe e continuar",
    "儲存密碼並繼續"
  ],
  "Use at least 12 characters and enter the same password in both fields.": [
    "Use pelo menos 12 caracteres e introduza a mesma palavra-passe nos dois campos.",
    "請使用至少 12 個字元，並在兩個欄位輸入相同密碼。"
  ],
  "Updating your password…": [
    "A atualizar a palavra-passe…",
    "正在更新密碼…"
  ],
  "The change could not be confirmed. Use a different password. If your session has expired, sign out and sign in again.": [
    "Não foi possível confirmar a alteração. Use outra palavra-passe. Se a sessão expirou, termine e volte a iniciar sessão.",
    "無法確認變更。請使用不同的密碼。如果登入已過期，請登出後重新登入。"
  ],
  "Information Management System access": [
    "Acesso ao Sistema de Gestão de Informação",
    "資訊管理系統權限"
  ],
  "Reason for IMS access": [
    "Motivo do acesso ao IMS",
    "申請 IMS 權限的原因"
  ],
  "Your account has no IMS role. Request access from the module administrator.": [
    "A sua conta não tem uma função no IMS. Solicite acesso ao administrador do módulo.",
    "您的帳號尚未有 IMS 角色。請向模組管理員申請權限。"
  ],
  "Your request is pending approval by the IMS administrator.": [
    "O seu pedido aguarda aprovação do administrador do IMS.",
    "您的申請正在等待 IMS 管理員核准。"
  ],
  "Request sent. Pending approval by the IMS administrator.": [
    "Pedido enviado. Aguarda aprovação do administrador do IMS.",
    "申請已送出，等待 IMS 管理員核准。"
  ],
  "Access service is unavailable. Try Check access again.": [
    "O serviço de acesso está indisponível. Tente Verificar acesso novamente.",
    "權限服務暫時無法使用。請再次檢查權限。"
  ],
  "Your last request was rejected. You may submit a new request.": [
    "O seu último pedido foi rejeitado. Pode enviar um novo pedido.",
    "上次申請已被拒絕。您可以重新申請。"
  ],
  "Your IMS access was revoked. Submit a request if you need access again.": [
    "O seu acesso ao IMS foi revogado. Envie um pedido se precisar de acesso novamente.",
    "您的 IMS 權限已撤銷。如需使用，請重新申請。"
  ],
  "Confirm your email address before continuing.": [
    "Confirme o seu endereço de email antes de continuar.",
    "請先確認電子郵件地址。"
  ],
  "Your account is awaiting administrator approval.": [
    "A sua conta aguarda aprovação do administrador.",
    "您的帳號正在等待管理員核准。"
  ],
  "Your account does not currently have access. Contact an administrator.": [
    "A sua conta não tem acesso neste momento. Contacte um administrador.",
    "您的帳號目前無權限。請聯絡管理員。"
  ],
  "Platform access is temporarily disabled.": [
    "O acesso à plataforma está temporariamente desativado.",
    "平台存取暫時停用。"
  ],
  "MANAGEMENT": [
    "GESTÃO",
    "管理"
  ],
  "Light appearance": [
    "Modo claro",
    "淺色模式"
  ],
  "Dark appearance": [
    "Modo escuro",
    "深色模式"
  ],
  "System appearance": [
    "Tema do dispositivo",
    "跟隨裝置設定"
  ],
  "Logistics & Warehouse Management": [
    "Gestão de Logística e Armazém",
    "物流與倉儲管理"
  ],
  "Transport operations. Warehouse integration pending.": [
    "Operações de transporte. Integração do armazém pendente.",
    "運輸作業。倉儲整合尚未完成。"
  ],
  "Overview": [
    "Visão geral",
    "總覽"
  ],
  "Activities": [
    "Atividades",
    "活動"
  ],
  "Projects": [
    "Projetos",
    "專案"
  ],
  "Departments": [
    "Departamentos",
    "部門"
  ],
  "Locations": [
    "Localizações",
    "地點"
  ],
  "IMS staff": [
    "Equipa do IMS",
    "IMS 人員"
  ],
  "Audit history": [
    "Histórico de auditoria",
    "稽核紀錄"
  ],
  "Access management": [
    "Gestão de acessos",
    "權限管理"
  ],
  "Archive": [
    "Arquivo",
    "封存"
  ],
  "INFORMATION MANAGEMENT": [
    "GESTÃO DE INFORMAÇÃO",
    "資訊管理"
  ],
  "Activities and records": [
    "Atividades e registos",
    "活動與紀錄"
  ],
  "Manage organizational activities in the Information Management System.": [
    "Gerir atividades da organização no Sistema de Gestão de Informação.",
    "在資訊管理系統中管理組織活動。"
  ],
  "IMS sections": [
    "Secções do IMS",
    "IMS 功能區"
  ],
  "Manage users": [
    "Gerir utilizadores",
    "管理使用者"
  ],
  "Checking IMS access…": [
    "A verificar acesso ao IMS…",
    "正在檢查 IMS 權限…"
  ],
  "Sign in required.": [
    "É necessário iniciar sessão.",
    "請先登入。"
  ],
  "IMS access is not assigned or this operation is not permitted.": [
    "O acesso ao IMS não foi atribuído ou esta operação não é permitida.",
    "尚未授予 IMS 權限，或不允許執行此操作。"
  ],
  "IMS is unavailable.": [
    "O IMS está indisponível.",
    "IMS 暫時無法使用。"
  ],
  "IMS access has not been assigned.": [
    "O acesso ao IMS não foi atribuído.",
    "尚未授予 IMS 權限。"
  ],
  "Refresh before retrying an uncertain save.": [
    "Atualize antes de repetir uma gravação não confirmada.",
    "若無法確認是否已儲存，請先重新整理再重試。"
  ],
  "Create activity": [
    "Criar atividade",
    "建立活動"
  ],
  "Refresh activities": [
    "Atualizar atividades",
    "重新整理活動"
  ],
  "Export activities": [
    "Exportar atividades",
    "匯出活動"
  ],
  "Search activities": [
    "Pesquisar atividades",
    "搜尋活動"
  ],
  "Open activity": [
    "Abrir atividade",
    "開啟活動"
  ],
  "Edit activity": [
    "Editar atividade",
    "編輯活動"
  ],
  "New activity": [
    "Nova atividade",
    "新增活動"
  ],
  "Activity name": [
    "Nome da atividade",
    "活動名稱"
  ],
  "Date": [
    "Data",
    "日期"
  ],
  "Place": [
    "Local",
    "場所"
  ],
  "Activity type": [
    "Tipo de atividade",
    "活動類型"
  ],
  "Department": [
    "Departamento",
    "部門"
  ],
  "Project": [
    "Projeto",
    "專案"
  ],
  "Location": [
    "Localização",
    "地點"
  ],
  "Planned participants": [
    "Participantes previstos",
    "預計參與人數"
  ],
  "Objectives": [
    "Objetivos",
    "目標"
  ],
  "Results": [
    "Resultados",
    "成果"
  ],
  "Save activity": [
    "Guardar atividade",
    "儲存活動"
  ],
  "Provide a place or location.": [
    "Indique um local ou uma localização.",
    "請填寫場所或選擇地點。"
  ],
  "Activity details": [
    "Detalhes da atividade",
    "活動詳情"
  ],
  "Activity unavailable.": [
    "Atividade indisponível.",
    "活動無法使用。"
  ],
  "Back to activities": [
    "Voltar às atividades",
    "返回活動"
  ],
  "Submit for review": [
    "Submeter para revisão",
    "送交審查"
  ],
  "Verify activity": [
    "Verificar atividade",
    "查核活動"
  ],
  "Approve activity": [
    "Aprovar atividade",
    "核准活動"
  ],
  "Activity updated.": [
    "Atividade atualizada.",
    "活動已更新。"
  ],
  "Return for correction": [
    "Devolver para correção",
    "退回修正"
  ],
  "Reopen activity": [
    "Reabrir atividade",
    "重新開啟活動"
  ],
  "Archive activity": [
    "Arquivar atividade",
    "封存活動"
  ],
  "Archive this activity? It can be restored from Archive.": [
    "Arquivar esta atividade? Pode ser restaurada a partir do Arquivo.",
    "要封存此活動嗎？之後可從封存區還原。"
  ],
  "Attendance": [
    "Presenças",
    "出席紀錄"
  ],
  "Export attendance": [
    "Exportar presenças",
    "匯出出席紀錄"
  ],
  "Edit attendance": [
    "Editar presença",
    "編輯出席紀錄"
  ],
  "Add attendance": [
    "Registar presença",
    "新增出席紀錄"
  ],
  "Participant name": [
    "Nome do participante",
    "參與者姓名"
  ],
  "Attendance status": [
    "Estado de presença",
    "出席狀態"
  ],
  "Present": [
    "Presente",
    "出席"
  ],
  "Absent": [
    "Ausente",
    "缺席"
  ],
  "Save attendance": [
    "Guardar presença",
    "儲存出席紀錄"
  ],
  "Attendance saved.": [
    "Presença guardada.",
    "出席紀錄已儲存。"
  ],
  "Archive attendance": [
    "Arquivar presença",
    "封存出席紀錄"
  ],
  "No attendance records yet.": [
    "Ainda não existem registos de presença.",
    "尚無出席紀錄。"
  ],
  "Files": [
    "Ficheiros",
    "檔案"
  ],
  "Choose file": [
    "Escolher ficheiro",
    "選擇檔案"
  ],
  "Caption": [
    "Legenda",
    "檔案說明"
  ],
  "Upload file": [
    "Carregar ficheiro",
    "上傳檔案"
  ],
  "Maximum 10 MB. Files remain private.": [
    "Máximo de 10 MB. Os ficheiros permanecem privados.",
    "上限為 10 MB。檔案保持非公開。"
  ],
  "Choose a file between 1 byte and 10 MB.": [
    "Escolha um ficheiro entre 1 byte e 10 MB.",
    "請選擇大小介於 1 位元組至 10 MB 的檔案。"
  ],
  "File uploaded and registered in IMS.": [
    "Ficheiro carregado e registado no IMS.",
    "檔案已上傳並登記於 IMS。"
  ],
  "Download file": [
    "Descarregar ficheiro",
    "下載檔案"
  ],
  "Archive file": [
    "Arquivar ficheiro",
    "封存檔案"
  ],
  "No files attached.": [
    "Não existem ficheiros anexados.",
    "沒有附加檔案。"
  ],
  "Invalid download address": [
    "Endereço de transferência inválido",
    "下載位址無效"
  ],
  "File download failed": [
    "Falha ao descarregar o ficheiro",
    "檔案下載失敗"
  ],
  "Downloaded size does not match the file record": [
    "O tamanho descarregado não corresponde ao registo do ficheiro",
    "下載大小與檔案紀錄不符"
  ],
  "Reason": [
    "Motivo",
    "原因"
  ],
  "Confirm": [
    "Confirmar",
    "確認"
  ],
  "Cancel": [
    "Cancelar",
    "取消"
  ],
  "Save": [
    "Guardar",
    "儲存"
  ],
  "None": [
    "Nenhum",
    "無"
  ],
  "Yes": [
    "Sim",
    "是"
  ],
  "No": [
    "Não",
    "否"
  ],
  "Filter overview": [
    "Filtrar visão geral",
    "篩選總覽"
  ],
  "From": [
    "De",
    "起始日期"
  ],
  "To": [
    "Até",
    "結束日期"
  ],
  "Apply filters": [
    "Aplicar filtros",
    "套用篩選"
  ],
  "Participants": [
    "Participantes",
    "參與者"
  ],
  "Code": [
    "Código",
    "代碼"
  ],
  "Portuguese name": [
    "Nome em português",
    "葡萄牙文名稱"
  ],
  "English name": [
    "Nome em inglês",
    "英文名稱"
  ],
  "Chinese name": [
    "Nome em chinês",
    "中文名稱"
  ],
  "Active": [
    "Ativo",
    "啟用"
  ],
  "Name": [
    "Nome",
    "名稱"
  ],
  "Level": [
    "Nível",
    "層級"
  ],
  "Parent location": [
    "Localização superior",
    "上層地點"
  ],
  "Project name": [
    "Nome do projeto",
    "專案名稱"
  ],
  "Start date": [
    "Data de início",
    "開始日期"
  ],
  "End date": [
    "Data de fim",
    "結束日期"
  ],
  "Budget": [
    "Orçamento",
    "預算"
  ],
  "Status": [
    "Estado",
    "狀態"
  ],
  "Responsible person": [
    "Responsável",
    "負責人"
  ],
  "Description": [
    "Descrição",
    "說明"
  ],
  "Approved": [
    "Aprovado",
    "已核准"
  ],
  "Role": [
    "Função",
    "角色"
  ],
  "IMS administrator": [
    "Administrador do IMS",
    "IMS 管理員"
  ],
  "Edit record": [
    "Editar registo",
    "編輯紀錄"
  ],
  "New record": [
    "Novo registo",
    "新增紀錄"
  ],
  "Record saved.": [
    "Registo guardado.",
    "紀錄已儲存。"
  ],
  "No records found.": [
    "Nenhum registo encontrado.",
    "找不到紀錄。"
  ],
  "Manage departments": [
    "Gerir departamentos",
    "管理部門"
  ],
  "Manage locations": [
    "Gerir localizações",
    "管理地點"
  ],
  "Manage projects": [
    "Gerir projetos",
    "管理專案"
  ],
  "Manage staff": [
    "Gerir equipa",
    "管理人員"
  ],
  "Add department": [
    "Adicionar departamento",
    "新增部門"
  ],
  "Add location": [
    "Adicionar localização",
    "新增地點"
  ],
  "Add project": [
    "Adicionar projeto",
    "新增專案"
  ],
  "Restore activity": [
    "Restaurar atividade",
    "還原活動"
  ],
  "Restore attendance": [
    "Restaurar presença",
    "還原出席紀錄"
  ],
  "Restore file": [
    "Restaurar ficheiro",
    "還原檔案"
  ],
  "No archived activities.": [
    "Não existem atividades arquivadas.",
    "沒有已封存的活動。"
  ],
  "No archived attendance.": [
    "Não existem presenças arquivadas.",
    "沒有已封存的出席紀錄。"
  ],
  "No archived files.": [
    "Não existem ficheiros arquivados.",
    "沒有已封存的檔案。"
  ],
  "IMS access management": [
    "Gestão de acessos ao IMS",
    "IMS 權限管理"
  ],
  "Only an IMS administrator approves module access. Portal accounts do not receive an IMS role automatically.": [
    "Apenas um administrador do IMS aprova o acesso ao módulo. As contas do Portal não recebem automaticamente uma função no IMS.",
    "只有 IMS 管理員可核准模組權限。Portal 帳號不會自動取得 IMS 角色。"
  ],
  "Refresh access requests": [
    "Atualizar pedidos de acesso",
    "重新整理權限申請"
  ],
  "Protected account": [
    "Conta protegida",
    "受保護帳號"
  ],
  "Decide access": [
    "Decidir acesso",
    "審核權限"
  ],
  "Decision": [
    "Decisão",
    "決定"
  ],
  "Approve / update role": [
    "Aprovar / atualizar função",
    "核准／更新角色"
  ],
  "Reject request": [
    "Rejeitar pedido",
    "拒絕申請"
  ],
  "Revoke access": [
    "Revogar acesso",
    "撤銷權限"
  ],
  "IMS role": [
    "Função no IMS",
    "IMS 角色"
  ],
  "Reason for decision": [
    "Motivo da decisão",
    "決定原因"
  ],
  "Save access decision": [
    "Guardar decisão de acesso",
    "儲存權限決定"
  ],
  "IMS authorization updated. The user can refresh the Portal.": [
    "Autorização do IMS atualizada. O utilizador pode atualizar o Portal.",
    "IMS 授權已更新。使用者可重新整理 Portal。"
  ],
  "Authorization history": [
    "Histórico de autorizações",
    "授權紀錄"
  ],
  "No role granted": [
    "Nenhuma função atribuída",
    "未授予角色"
  ],
  "Export audit history": [
    "Exportar histórico de auditoria",
    "匯出稽核紀錄"
  ],
  "training": [
    "Formação",
    "培訓"
  ],
  "distribution": [
    "Distribuição",
    "發放"
  ],
  "health": [
    "Saúde",
    "健康"
  ],
  "education": [
    "Educação",
    "教育"
  ],
  "relief": [
    "Ajuda humanitária",
    "救援"
  ],
  "environment": [
    "Ambiente",
    "環境"
  ],
  "volunteer": [
    "Voluntariado",
    "志工服務"
  ],
  "meeting": [
    "Reunião",
    "會議"
  ],
  "other": [
    "Outro",
    "其他"
  ],
  "province": [
    "Província",
    "省"
  ],
  "district": [
    "Distrito",
    "區"
  ],
  "community": [
    "Comunidade",
    "社區"
  ],
  "planned": [
    "Planeado",
    "已規劃"
  ],
  "submitted": [
    "Submetido",
    "已提交"
  ],
  "verified": [
    "Verificado",
    "已查核"
  ],
  "approved": [
    "Aprovado",
    "已核准"
  ],
  "completed": [
    "Concluído",
    "已完成"
  ],
  "cancelled": [
    "Cancelado",
    "已取消"
  ],
  "active": [
    "Ativo",
    "啟用"
  ],
  "pending": [
    "Pendente",
    "待審核"
  ],
  "rejected": [
    "Rejeitado",
    "已拒絕"
  ],
  "revoked": [
    "Revogado",
    "已撤銷"
  ],
  "inactive": [
    "Inativo",
    "停用"
  ],
  "available": [
    "Disponível",
    "可用"
  ],
  "maintenance": [
    "Em manutenção",
    "維修中"
  ],
  "field_officer": [
    "Agente de campo",
    "現場人員"
  ],
  "department_head": [
    "Chefe de departamento",
    "部門主管"
  ],
  "finance": [
    "Finanças",
    "財務"
  ],
  "leadership": [
    "Direção",
    "管理層"
  ],
  "im_team": [
    "Equipa de gestão de informação",
    "資訊管理團隊"
  ],
  "viewer": [
    "Leitor",
    "檢視者"
  ],
  "operator": [
    "Operador",
    "操作員"
  ],
  "manager": [
    "Gestor",
    "經理"
  ],
  "administrator": [
    "Administrador",
    "管理員"
  ],
  "Viewer": [
    "Leitor",
    "檢視者"
  ],
  "Operator": [
    "Operador",
    "操作員"
  ],
  "Manager": [
    "Gestor",
    "經理"
  ],
  "Administrator": [
    "Administrador",
    "管理員"
  ],
  "System Owner": [
    "Proprietário do Sistema",
    "系統擁有者"
  ],
  "Restricted Administrator": [
    "Administrador com restrições",
    "受限管理員"
  ],
  "Member": [
    "Membro",
    "成員"
  ],
  "member": [
    "Membro",
    "成員"
  ],
  "system_owner": [
    "Proprietário do Sistema",
    "系統擁有者"
  ],
  "restricted_admin": [
    "Administrador com restrições",
    "受限管理員"
  ],
  "TRANSPORTATION": [
    "TRANSPORTE",
    "運輸"
  ],
  "Transport": [
    "Transporte",
    "運輸"
  ],
  "Keep every journey organized.": [
    "Organize todas as deslocações.",
    "妥善安排每趟行程。"
  ],
  "Manage vehicles and coordinate transport requests from one workspace.": [
    "Gerir viaturas e coordenar pedidos de transporte num só espaço.",
    "在同一工作空間管理車輛與運輸申請。"
  ],
  "Refresh transport": [
    "Atualizar transporte",
    "重新整理運輸"
  ],
  "Saving…": [
    "A guardar…",
    "正在儲存…"
  ],
  "Saved successfully. The list has been refreshed.": [
    "Guardado com sucesso. A lista foi atualizada.",
    "儲存成功。清單已更新。"
  ],
  "Edit vehicle": [
    "Editar viatura",
    "編輯車輛"
  ],
  "Register vehicle": [
    "Registar viatura",
    "登記車輛"
  ],
  "Registration number": [
    "Matrícula",
    "車牌號碼"
  ],
  "Vehicle name / model": [
    "Nome / modelo da viatura",
    "車輛名稱／型號"
  ],
  "Passenger capacity": [
    "Capacidade de passageiros",
    "載客人數上限"
  ],
  "Mileage (km)": [
    "Quilometragem (km)",
    "里程（公里）"
  ],
  "Operational status": [
    "Estado operacional",
    "運作狀態"
  ],
  "Available": [
    "Disponível",
    "可用"
  ],
  "Maintenance": [
    "Em manutenção",
    "維修中"
  ],
  "Inactive": [
    "Inativo",
    "停用"
  ],
  "Save vehicle": [
    "Guardar viatura",
    "儲存車輛"
  ],
  "Edit transport request": [
    "Editar pedido de transporte",
    "編輯運輸申請"
  ],
  "New transport request": [
    "Novo pedido de transporte",
    "新增運輸申請"
  ],
  "All departure and return times below use Mozambique time (UTC+02:00).": [
    "Todas as horas de partida e regresso abaixo usam a hora de Moçambique (UTC+02:00).",
    "以下所有出發及返回時間均使用莫三比克時間（UTC+02:00）。"
  ],
  "Vehicle": [
    "Viatura",
    "車輛"
  ],
  "Select a vehicle": [
    "Selecionar viatura",
    "選擇車輛"
  ],
  "Destination": [
    "Destino",
    "目的地"
  ],
  "Purpose": [
    "Finalidade",
    "用途"
  ],
  "Passengers": [
    "Passageiros",
    "乘客人數"
  ],
  "Departure — Mozambique time": [
    "Partida — hora de Moçambique",
    "出發時間 — 莫三比克時間"
  ],
  "Expected return — Mozambique time": [
    "Regresso previsto — hora de Moçambique",
    "預計返回時間 — 莫三比克時間"
  ],
  "Request status": [
    "Estado do pedido",
    "申請狀態"
  ],
  "Pending": [
    "Pendente",
    "待審核"
  ],
  "Completed": [
    "Concluído",
    "已完成"
  ],
  "Cancelled": [
    "Cancelado",
    "已取消"
  ],
  "Save request": [
    "Guardar pedido",
    "儲存申請"
  ],
  "Loading vehicles and requests…": [
    "A carregar viaturas e pedidos…",
    "正在載入車輛與申請…"
  ],
  "Fleet": [
    "Frota",
    "車隊"
  ],
  "No vehicles registered.": [
    "Não existem viaturas registadas.",
    "尚未登記車輛。"
  ],
  "All transport requests": [
    "Todos os pedidos de transporte",
    "所有運輸申請"
  ],
  "My transport requests": [
    "Os meus pedidos de transporte",
    "我的運輸申請"
  ],
  "New request": [
    "Novo pedido",
    "新增申請"
  ],
  "An available vehicle must be registered before you can request transport.": [
    "É necessário registar uma viatura disponível antes de solicitar transporte.",
    "必須先登記可用車輛，才能申請運輸。"
  ],
  "No requests on this page.": [
    "Não existem pedidos nesta página.",
    "此頁沒有申請。"
  ],
  "Edit request": [
    "Editar pedido",
    "編輯申請"
  ],
  "Previous requests": [
    "Pedidos anteriores",
    "上一頁申請"
  ],
  "Next requests": [
    "Próximos pedidos",
    "下一頁申請"
  ],
  "Transport is up to date.": [
    "Os dados do transporte estão atualizados.",
    "運輸資料已更新。"
  ],
  "You do not have transport access.": [
    "Não tem acesso ao transporte.",
    "您沒有運輸權限。"
  ],
  "PEOPLE & ACCOUNTS": [
    "PESSOAS E CONTAS",
    "人員與帳號"
  ],
  "← All modules": [
    "← Todos os módulos",
    "← 所有模組"
  ],
  "Create an account": [
    "Criar uma conta",
    "建立帳號"
  ],
  "Verify the employee’s identity and email. Deliver the temporary password directly to them; they must replace it on first sign-in.": [
    "Verifique a identidade e o email do colaborador. Entregue-lhe diretamente a palavra-passe temporária; deverá alterá-la no primeiro acesso.",
    "請確認員工身分與電子郵件。請直接交付臨時密碼；員工必須在首次登入時更換。"
  ],
  "Full name": [
    "Nome completo",
    "全名"
  ],
  "Work email": [
    "Email profissional",
    "工作電子郵件"
  ],
  "Position": [
    "Cargo",
    "職位"
  ],
  "Temporary password (12–128 characters)": [
    "Palavra-passe temporária (12–128 caracteres)",
    "臨時密碼（12–128 個字元）"
  ],
  "Confirm temporary password": [
    "Confirmar palavra-passe temporária",
    "確認臨時密碼"
  ],
  "Create account": [
    "Criar conta",
    "建立帳號"
  ],
  "Previous": [
    "Anterior",
    "上一頁"
  ],
  "Next": [
    "Seguinte",
    "下一頁"
  ],
  "Refresh directory": [
    "Atualizar diretório",
    "重新整理名錄"
  ],
  "Employee directory": [
    "Diretório de colaboradores",
    "員工名錄"
  ],
  "HR access is no longer available. Select Check access.": [
    "O acesso aos Recursos Humanos já não está disponível. Selecione Verificar acesso.",
    "人力資源權限已無法使用。請選擇檢查權限。"
  ],
  "This record changed. Refresh before editing.": [
    "Este registo foi alterado. Atualize antes de editar.",
    "此紀錄已變更。請先重新整理再編輯。"
  ],
  "The operation could not be confirmed. Refresh before retrying.": [
    "Não foi possível confirmar a operação. Atualize antes de tentar novamente.",
    "無法確認操作結果。請先重新整理再重試。"
  ],
  "Protected administrative account.": [
    "Conta administrativa protegida.",
    "受保護的管理帳號。"
  ],
  "Save employee details": [
    "Guardar dados do colaborador",
    "儲存員工資料"
  ],
  "Employee details saved.": [
    "Dados do colaborador guardados.",
    "員工資料已儲存。"
  ],
  "The temporary passwords do not match.": [
    "As palavras-passe temporárias não coincidem.",
    "臨時密碼不一致。"
  ],
  "Creating account…": [
    "A criar conta…",
    "正在建立帳號…"
  ],
  "Account created. The employee must change the temporary password on first sign-in. No business-module access was assigned.": [
    "Conta criada. O colaborador deve alterar a palavra-passe temporária no primeiro acesso. Não foi atribuído acesso aos módulos de negócio.",
    "帳號已建立。員工必須在首次登入時更換臨時密碼。尚未授予任何業務模組權限。"
  ],
  "Creation could not be confirmed. Refresh the directory before retrying. Check the email and your permissions.": [
    "Não foi possível confirmar a criação. Atualize o diretório antes de tentar novamente. Verifique o email e as suas permissões.",
    "無法確認是否已建立。請先重新整理名錄再重試，並檢查電子郵件與您的權限。"
  ],
  "Human Resources access is required.": [
    "É necessário acesso aos Recursos Humanos.",
    "需要人力資源權限。"
  ],
  "SYSTEM ADMINISTRATION": [
    "ADMINISTRAÇÃO DO SISTEMA",
    "系統管理"
  ],
  "People, permissions & platform": [
    "Pessoas, permissões e plataforma",
    "人員、權限與平台"
  ],
  "Manage account approvals and module access in one place.": [
    "Gerir aprovações de contas e acessos aos módulos num só local.",
    "在同一處管理帳號審核與模組權限。"
  ],
  "Administration sections": [
    "Secções de administração",
    "管理功能區"
  ],
  "Account approvals": [
    "Aprovações de contas",
    "帳號審核"
  ],
  "Module permissions": [
    "Permissões dos módulos",
    "模組權限"
  ],
  "Account & platform": [
    "Conta e plataforma",
    "帳號與平台"
  ],
  "Pending accounts": [
    "Contas pendentes",
    "待審核帳號"
  ],
  "Approval activates the account. It does not grant module access. A confirmed email is required for approval.": [
    "A aprovação ativa a conta, mas não concede acesso aos módulos. É necessário um email confirmado para aprovar.",
    "核准會啟用帳號，但不會授予模組權限。核准前必須確認電子郵件。"
  ],
  "Refresh pending accounts": [
    "Atualizar contas pendentes",
    "重新整理待審核帳號"
  ],
  "User permissions": [
    "Permissões dos utilizadores",
    "使用者權限"
  ],
  "Platform roles and the System Owner are protected. Transport permissions apply only to this module.": [
    "As funções da plataforma e o System Owner estão protegidos. As permissões de transporte aplicam-se apenas a esse módulo.",
    "平台角色與系統擁有者受到保護。運輸權限僅適用於運輸模組。"
  ],
  "Administrator access is required to manage users.": [
    "É necessário acesso de administrador para gerir utilizadores.",
    "管理使用者需要管理員權限。"
  ],
  "You no longer have permission. Select Check access.": [
    "Já não tem permissão. Selecione Verificar acesso.",
    "您已沒有權限。請選擇檢查權限。"
  ],
  "This account changed. Refresh the list before deciding.": [
    "Esta conta foi alterada. Atualize a lista antes de decidir.",
    "此帳號已變更。請先重新整理清單再決定。"
  ],
  "Check the reason and email confirmation before trying again.": [
    "Verifique o motivo e a confirmação do email antes de tentar novamente.",
    "請檢查原因與電子郵件確認狀態後重試。"
  ],
  "Account review is not installed yet. Run database migration 003.": [
    "A revisão de contas ainda não está instalada. Execute a migração 003 da base de dados.",
    "帳號審核尚未安裝。請執行資料庫遷移 003。"
  ],
  "The operation could not be confirmed. Refresh the list before trying again.": [
    "Não foi possível confirmar a operação. Atualize a lista antes de tentar novamente.",
    "無法確認操作結果。請先重新整理清單再重試。"
  ],
  "Name not provided": [
    "Nome não fornecido",
    "未提供姓名"
  ],
  "Email unavailable": [
    "Email indisponível",
    "電子郵件無法取得"
  ],
  "Email confirmed": [
    "Email confirmado",
    "電子郵件已確認"
  ],
  "Email not confirmed": [
    "Email não confirmado",
    "電子郵件尚未確認"
  ],
  "Review account": [
    "Rever conta",
    "審核帳號"
  ],
  "Reason (5–500 characters)": [
    "Motivo (5–500 caracteres)",
    "原因（5–500 個字元）"
  ],
  "Approve": [
    "Aprovar",
    "核准"
  ],
  "Reject": [
    "Rejeitar",
    "拒絕"
  ],
  "Enter a reason containing at least 5 characters.": [
    "Introduza um motivo com pelo menos 5 caracteres.",
    "請輸入至少 5 個字元的原因。"
  ],
  "Saving decision…": [
    "A guardar decisão…",
    "正在儲存決定…"
  ],
  "Account approved.": [
    "Conta aprovada.",
    "帳號已核准。"
  ],
  "Account rejected.": [
    "Conta rejeitada.",
    "帳號已拒絕。"
  ],
  "Loading pending accounts…": [
    "A carregar contas pendentes…",
    "正在載入待審核帳號…"
  ],
  "Review a pending account below.": [
    "Reveja uma conta pendente abaixo.",
    "請在下方審核待處理帳號。"
  ],
  "No pending accounts on this page.": [
    "Não existem contas pendentes nesta página.",
    "此頁沒有待審核帳號。"
  ],
  "Open transport and view vehicles": [
    "Abrir transporte e consultar viaturas",
    "開啟運輸並檢視車輛"
  ],
  "Create transport requests": [
    "Criar pedidos de transporte",
    "建立運輸申請"
  ],
  "Edit permitted requests": [
    "Editar pedidos permitidos",
    "編輯獲授權的申請"
  ],
  "Approve and complete requests": [
    "Aprovar e concluir pedidos",
    "核准及完成申請"
  ],
  "Add and edit vehicles": [
    "Adicionar e editar viaturas",
    "新增及編輯車輛"
  ],
  "View all users' requests (otherwise own requests only)": [
    "Ver os pedidos de todos os utilizadores (caso contrário, apenas os próprios)",
    "查看所有使用者的申請（否則僅限本人申請）"
  ],
  "Access denied. Your permissions may have changed. Select Check access.": [
    "Acesso negado. As suas permissões podem ter mudado. Selecione Verificar acesso.",
    "存取遭拒。您的權限可能已變更。請選擇檢查權限。"
  ],
  "Someone changed this record. Refresh and review it before saving again.": [
    "Alguém alterou este registo. Atualize e reveja-o antes de guardar novamente.",
    "有人已變更此紀錄。請先重新整理並檢查，再儲存。"
  ],
  "That registration number already exists.": [
    "Essa matrícula já existe.",
    "此車牌號碼已存在。"
  ],
  "Check the entered values.": [
    "Verifique os valores introduzidos.",
    "請檢查輸入的值。"
  ],
  "Complete all required fields and check the permitted values.": [
    "Preencha todos os campos obrigatórios e verifique os valores permitidos.",
    "請填寫所有必填欄位並檢查允許的值。"
  ],
  "The operation could not be confirmed. Refresh before trying again.": [
    "Não foi possível confirmar a operação. Atualize antes de tentar novamente.",
    "無法確認操作結果。請先重新整理再重試。"
  ],
  "Refresh user permissions": [
    "Atualizar permissões dos utilizadores",
    "重新整理使用者權限"
  ],
  "Previous users": [
    "Utilizadores anteriores",
    "上一頁使用者"
  ],
  "Next users": [
    "Próximos utilizadores",
    "下一頁使用者"
  ],
  "Select a transport profile or override individual permissions.": [
    "Selecione um perfil de transporte ou personalize as permissões individuais.",
    "選擇運輸角色設定，或覆寫個別權限。"
  ],
  "No users.": [
    "Não existem utilizadores.",
    "沒有使用者。"
  ],
  "Protected account — no changes permitted here.": [
    "Conta protegida — não são permitidas alterações aqui.",
    "受保護帳號 — 此處不允許修改。"
  ],
  "Approve this account before assigning modules.": [
    "Aprove esta conta antes de atribuir módulos.",
    "請先核准此帳號，再指派模組。"
  ],
  "Transport profile": [
    "Perfil de transporte",
    "運輸角色設定"
  ],
  "No access": [
    "Sem acesso",
    "無權限"
  ],
  "Viewer — fleet and own requests": [
    "Leitor — frota e pedidos próprios",
    "檢視者 — 車隊及本人申請"
  ],
  "Requester — create and edit own requests": [
    "Requisitante — criar e editar pedidos próprios",
    "申請者 — 建立及編輯本人申請"
  ],
  "Dispatcher — all transport operations": [
    "Gestor de transporte — todas as operações",
    "調度員 — 所有運輸作業"
  ],
  "Use role default follows the selected profile. Allow/Deny overrides it for this user. Opening transport must also be allowed.": [
    "Usar predefinição da função segue o perfil selecionado. Permitir/Negar substitui-o para este utilizador. A abertura do transporte também deve ser permitida.",
    "使用角色預設值會依循選定設定。允許／拒絕可覆寫此使用者的設定，也必須允許開啟運輸。"
  ],
  "Use role default": [
    "Usar predefinição da função",
    "使用角色預設值"
  ],
  "Allow": [
    "Permitir",
    "允許"
  ],
  "Deny": [
    "Negar",
    "拒絕"
  ],
  "Reason for change": [
    "Motivo da alteração",
    "變更原因"
  ],
  "Save permissions": [
    "Guardar permissões",
    "儲存權限"
  ],
  "Saving permissions…": [
    "A guardar permissões…",
    "正在儲存權限…"
  ],
  "Permissions saved and recorded in the audit trail.": [
    "Permissões guardadas e registadas no histórico de auditoria.",
    "權限已儲存並記錄於稽核紀錄。"
  ],
  "Enter your name.": [
    "Introduza o seu nome.",
    "請輸入您的姓名。"
  ],
  "Unable to confirm the change. Select Check access before retrying.": [
    "Não foi possível confirmar a alteração. Selecione Verificar acesso antes de tentar novamente.",
    "無法確認變更。請先選擇檢查權限再重試。"
  ],
  "Platform access": [
    "Acesso à plataforma",
    "平台存取"
  ],
  "Only the System Owner can change this setting. Disabling access blocks protected operations for everyone except the active, verified Owner. It does not delete accounts.": [
    "Apenas o System Owner pode alterar esta definição. Desativar o acesso bloqueia as operações protegidas para todos, exceto o proprietário ativo e verificado. Não elimina contas.",
    "只有系統擁有者可變更此設定。停用後，除已啟用且驗證的擁有者外，所有人的受保護操作都會被封鎖，不會刪除帳號。"
  ],
  "Checking current setting…": [
    "A verificar a definição atual…",
    "正在檢查目前設定…"
  ],
  "Reason for this change": [
    "Motivo desta alteração",
    "此次變更的原因"
  ],
  "Checking access": [
    "A verificar acesso",
    "正在檢查權限"
  ],
  "Refresh setting": [
    "Atualizar definição",
    "重新整理設定"
  ],
  "Platform access is enabled.": [
    "O acesso à plataforma está ativo.",
    "平台存取已啟用。"
  ],
  "Platform access is disabled for other users.": [
    "O acesso à plataforma está desativado para os outros utilizadores.",
    "其他使用者的平台存取已停用。"
  ],
  "Disable platform access": [
    "Desativar acesso à plataforma",
    "停用平台存取"
  ],
  "Enable platform access": [
    "Ativar acesso à plataforma",
    "啟用平台存取"
  ],
  "Unable to verify the setting. No change is available until it can be refreshed.": [
    "Não foi possível verificar a definição. Não pode ser alterada até ser atualizada.",
    "無法確認設定。必須重新整理後才能變更。"
  ],
  "Enter a reason containing 5 to 500 characters.": [
    "Introduza um motivo entre 5 e 500 caracteres.",
    "請輸入 5 至 500 個字元的原因。"
  ],
  "Disable access for all other users? Your Owner access will remain available.": [
    "Desativar o acesso para todos os outros utilizadores? O seu acesso de proprietário será mantido.",
    "要停用所有其他使用者的權限嗎？您的擁有者權限將保留。"
  ],
  "Restore platform access? Each account will still require its own permissions.": [
    "Restaurar o acesso à plataforma? Cada conta continuará a precisar das suas próprias permissões.",
    "要恢復平台存取嗎？每個帳號仍需具備各自的權限。"
  ],
  "The change could not be confirmed. Refresh the setting before retrying.": [
    "Não foi possível confirmar a alteração. Atualize a definição antes de tentar novamente.",
    "無法確認變更。請先重新整理設定再重試。"
  ],
  "Set your personal password before entering the workspace.": [
    "Defina a sua palavra-passe pessoal antes de entrar no espaço de trabalho.",
    "進入工作空間前，請先設定個人密碼。"
  ],
  "Unable to verify access. Check your connection and select Check access.": [
    "Não foi possível verificar o acesso. Verifique a ligação e selecione Verificar acesso.",
    "無法確認權限。請檢查連線並選擇檢查權限。"
  ],
  "Signing in…": [
    "A iniciar sessão…",
    "正在登入…"
  ],
  "Unable to sign in. Check your credentials, email confirmation and connection.": [
    "Não foi possível iniciar sessão. Verifique as credenciais, a confirmação do email e a ligação.",
    "無法登入。請檢查憑證、電子郵件確認狀態及連線。"
  ],
  "Signing out…": [
    "A terminar sessão…",
    "正在登出…"
  ],
  "Sign-out could not be confirmed. Please try again.": [
    "Não foi possível confirmar o fim da sessão. Tente novamente.",
    "無法確認是否已登出。請重試。"
  ],
  "TCMS is unavailable. Check your connection, public configuration and local web server.": [
    "O TCMS está indisponível. Verifique a ligação, a configuração pública e o servidor local.",
    "TCMS 無法使用。請檢查連線、公開設定與本機網頁伺服器。"
  ],
  "Enable JavaScript to verify your access.": [
    "Ative o JavaScript para verificar o seu acesso.",
    "請啟用 JavaScript 以檢查權限。"
  ],
  "{count} activities loaded from IMS.": [
    "{count} atividades carregadas do IMS.",
    "已從 IMS 載入 {count} 項活動。"
  ],
  "Activity {id} saved in IMS.": [
    "Atividade {id} guardada no IMS.",
    "活動 {id} 已儲存於 IMS。"
  ],
  "{present} present · {absent} absent · {files} files": [
    "{present} presentes · {absent} ausentes · {files} ficheiros",
    "{present} 人出席 · {absent} 人缺席 · {files} 個檔案"
  ],
  "{date} · {place} · {status}": [
    "{date} · {place} · {status}",
    "{date} · {place} · {status}"
  ],
  "Status: {status}": [
    "Estado: {status}",
    "狀態：{status}"
  ],
  "Objectives: {text}": [
    "Objetivos: {text}",
    "目標：{text}"
  ],
  "Results: {text}": [
    "Resultados: {text}",
    "成果：{text}"
  ],
  "Review note: {text}": [
    "Nota de revisão: {text}",
    "審查備註：{text}"
  ],
  "{count} activities": [
    "{count} atividades",
    "{count} 項活動"
  ],
  "Approved: {status}": [
    "Aprovado: {status}",
    "已核准：{status}"
  ],
  "Role: {role}": [
    "Função: {role}",
    "角色：{role}"
  ],
  "Request: {text}": [
    "Pedido: {text}",
    "申請：{text}"
  ],
  "Decision: {text}": [
    "Decisão: {text}",
    "決定：{text}"
  ],
  "Authorized by: {name}": [
    "Autorizado por: {name}",
    "授權人：{name}"
  ],
  "IMS role: {role}": [
    "Função no IMS: {role}",
    "IMS 角色：{role}"
  ],
  "{event} · {role}": [
    "{event} · {role}",
    "{event} · {role}"
  ],
  "Save {name}": [
    "Guardar {name}",
    "儲存 {name}"
  ],
  "File received: {name} ({bytes} bytes). Use Save if your browser did not start the download.": [
    "Ficheiro recebido: {name} ({bytes} bytes). Use Guardar se o navegador não iniciou a transferência.",
    "已接收檔案：{name}（{bytes} 位元組）。如果瀏覽器未開始下載，請選擇儲存。"
  ],
  "{error} Refresh before retrying an uncertain save.": [
    "{error} Atualize antes de repetir uma gravação não confirmada.",
    "{error} 若無法確認是否已儲存，請先重新整理再重試。"
  ],
  "{capacity} passengers · {mileage} km · {status}": [
    "{capacity} passageiros · {mileage} km · {status}",
    "{capacity} 位乘客 · {mileage} 公里 · {status}"
  ],
  "{registration} — {name} ({capacity} passengers; {status})": [
    "{registration} — {name} ({capacity} passageiros; {status})",
    "{registration} — {name}（{capacity} 位乘客；{status}）"
  ],
  "{destination} · {status}": [
    "{destination} · {status}",
    "{destination} · {status}"
  ],
  "{purpose} · {passengers} passengers": [
    "{purpose} · {passengers} passageiros",
    "{purpose} · {passengers} 位乘客"
  ],
  "Requested by: {name}": [
    "Solicitado por: {name}",
    "申請人：{name}"
  ],
  "Account: {status}": [
    "Conta: {status}",
    "帳號：{status}"
  ],
  "{email} · {role} · {status}": [
    "{email} · {role} · {status}",
    "{email} · {role} · {status}"
  ],
  "Save transport permissions for {email}?": [
    "Guardar as permissões de transporte de {email}?",
    "要儲存 {email} 的運輸權限嗎？"
  ],
  "{decision} the account for {email}?": [
    "{decision} a conta de {email}?",
    "要{decision} {email} 的帳號嗎？"
  ],
  "{prefix} {message}": [
    "{prefix} {message}",
    "{prefix} {message}"
  ],
  "{value}": [
    "{value}",
    "{value}"
  ],
  "{name} · {role}": [
    "{name} · {role}",
    "{name} · {role}"
  ],
  "requested": [
    "Solicitado",
    "已申請"
  ],
  "role_changed": [
    "Função alterada",
    "角色已變更"
  ],
  "access_approved": [
    "Acesso aprovado",
    "權限已核准"
  ],
  "access_rejected": [
    "Acesso rejeitado",
    "權限已拒絕"
  ],
  "access_revoked": [
    "Acesso revogado",
    "權限已撤銷"
  ],
  "Module integrations": [
    "Integrações dos módulos",
    "模組整合"
  ],
  "IMS operations are connected through the authenticated gateway. The configuration form below is for a future full-module authentication pilot.": [
    "As operações do IMS estão ligadas através do gateway autenticado. O formulário abaixo destina-se a um futuro teste de autenticação do módulo completo.",
    "IMS 作業已透過驗證閘道連線。下方設定表單用於未來完整模組驗證試行。"
  ],
  "Module identity and source Supabase project identified.": [
    "Identidade do módulo e projeto Supabase de origem identificados.",
    "已識別模組身分與來源 Supabase 專案。"
  ],
  "Local database checks: 104 passed. Real Supabase login and file operations still need testing.": [
    "Verificações locais da base de dados: 104 passaram. O login real no Supabase e as operações de ficheiros ainda precisam de testes.",
    "本機資料庫檢查：104 項通過。實際 Supabase 登入與檔案操作仍需測試。"
  ],
  "Module-owned IMS database connected; existing data remains in IMS.": [
    "Base de dados do responsável do IMS ligada; os dados existentes permanecem no IMS.",
    "模組擁有的 IMS 資料庫已連線；現有資料保留於 IMS。"
  ],
  "Activities, attendance, files, workflows and module management are connected.": [
    "Atividades, presenças, ficheiros, fluxos de trabalho e gestão do módulo estão ligados.",
    "活動、出席紀錄、檔案、工作流程與模組管理已連線。"
  ],
  "Gateway checks Portal access and IMS approval on every request. Original IMS login remains separate.": [
    "O gateway verifica o acesso ao Portal e a aprovação do IMS em cada pedido. O login original do IMS permanece separado.",
    "閘道會在每次請求檢查 Portal 權限與 IMS 核准狀態。原有 IMS 登入保持獨立。"
  ],
  "Download configuration template": [
    "Descarregar modelo de configuração",
    "下載設定範本"
  ],
  "Review completed configuration (JSON, maximum 8 KB)": [
    "Rever configuração preenchida (JSON, máximo de 8 KB)",
    "檢查已填寫的設定（JSON，上限 8 KB）"
  ],
  "File too large. Maximum size is 8 KB.": [
    "Ficheiro demasiado grande. O máximo é 8 KB.",
    "檔案過大。上限為 8 KB。"
  ],
  "Configuration format accepted. This review has not saved, connected or activated the module.": [
    "Formato de configuração aceite. Esta revisão não guardou, ligou nem ativou o módulo.",
    "設定格式已接受。此檢查未儲存、連線或啟用模組。"
  ],
  "Unable to read configuration. Use the supplied JSON template.": [
    "Não foi possível ler a configuração. Use o modelo JSON fornecido.",
    "無法讀取設定。請使用提供的 JSON 範本。"
  ],
  "Configuration review runs only in this browser. Files are not uploaded or saved. Never include passwords or secret keys.": [
    "A revisão decorre apenas neste navegador. Os ficheiros não são enviados nem guardados. Nunca inclua palavras-passe ou chaves secretas.",
    "設定檢查僅在此瀏覽器執行，不會上傳或儲存檔案。請勿包含密碼或秘密金鑰。"
  ],
  "Expected a configuration object.": [
    "Era esperado um objeto de configuração.",
    "預期為設定物件。"
  ],
  "Unexpected field. Use only the supplied template; do not include keys or credentials.": [
    "Campo inesperado. Use apenas o modelo fornecido; não inclua chaves nem credenciais.",
    "出現非預期欄位。請僅使用提供的範本，勿包含金鑰或憑證。"
  ],
  "Module identity or contract version does not match IMS.": [
    "A identidade do módulo ou a versão do contrato não corresponde ao IMS.",
    "模組身分或契約版本與 IMS 不符。"
  ],
  "The source project does not match the IMS handover.": [
    "O projeto de origem não corresponde à entrega do IMS.",
    "來源專案與 IMS 交接資料不符。"
  ],
  "Only a test environment can be prepared here.": [
    "Apenas um ambiente de testes pode ser preparado aqui.",
    "此處只能準備測試環境。"
  ],
  "Provide a separate IMS test project; neither the source IMS nor Portal project is accepted.": [
    "Indique um projeto de testes separado do IMS; não é aceite o projeto de origem do IMS nem o do Portal.",
    "請提供獨立的 IMS 測試專案；不可使用來源 IMS 或 Portal 專案。"
  ],
  "Authentication remains pending until the joint pilot passes.": [
    "A autenticação permanece pendente até o teste conjunto passar.",
    "共同試行通過前，驗證仍維持待處理狀態。"
  ],
  "Application and callback must share an origin for this pilot.": [
    "A aplicação e o retorno devem ter a mesma origem neste teste.",
    "此試行中，應用程式與回呼必須使用相同來源。"
  ],
  "Provide the GitHub repository address, without a file or branch path.": [
    "Indique o endereço do repositório GitHub, sem caminho de ficheiro ou ramo.",
    "請提供 GitHub 儲存庫位址，不含檔案或分支路徑。"
  ],
  "Application address": [
    "Endereço da aplicação",
    "應用程式位址"
  ],
  "Callback address": [
    "Endereço de retorno",
    "回呼位址"
  ],
  "Repository address": [
    "Endereço do repositório",
    "儲存庫位址"
  ],
  "{field}: use a public HTTPS address without credentials, query parameters or fragments.": [
    "{field}: use um endereço HTTPS público sem credenciais, parâmetros de consulta ou fragmentos.",
    "{field}：請使用不含憑證、查詢參數或片段的公開 HTTPS 位址。"
  ],
  "Invalid field: {field}.": [
    "Campo inválido: {field}.",
    "欄位無效：{field}。"
  ],
  "Home": [
    "Início",
    "首頁"
  ],
  "Sign In": [
    "Iniciar sessão",
    "登入"
  ],
  "Set your password": [
    "Definir palavra-passe",
    "設定密碼"
  ],
  "{name} — {description}": [
    "{name} — {description}",
    "{name} — {description}"
  ],
  "View activities, attendance, files and overview.": [
    "Consultar atividades, presenças, ficheiros e visão geral.",
    "檢視活動、出席紀錄、檔案與總覽。"
  ],
  "View, create and edit activities, attendance and files; submit for review.": [
    "Consultar, criar e editar atividades, presenças e ficheiros; submeter para revisão.",
    "檢視、建立及編輯活動、出席紀錄與檔案，並送交審查。"
  ],
  "Operator functions plus review, approval, projects and audit history.": [
    "Funções de operador, mais revisão, aprovação, projetos e histórico de auditoria.",
    "包含操作員功能，以及審查、核准、專案與稽核紀錄。"
  ],
  "Manage IMS access and operations, including archive and restore.": [
    "Gerir acessos e operações do IMS, incluindo arquivo e restauro.",
    "管理 IMS 權限與作業，包括封存及還原。"
  ],
  "Invalid field: contractVersion.": [
    "Campo inválido: contractVersion.",
    "欄位無效：contractVersion。"
  ],
  "Invalid field: moduleCode.": [
    "Campo inválido: moduleCode.",
    "欄位無效：moduleCode。"
  ],
  "Invalid field: displayName.": [
    "Campo inválido: displayName.",
    "欄位無效：displayName。"
  ],
  "Invalid field: projectRef.": [
    "Campo inválido: projectRef.",
    "欄位無效：projectRef。"
  ],
  "Invalid field: environment.": [
    "Campo inválido: environment.",
    "欄位無效：environment。"
  ],
  "Invalid field: testProjectRef.": [
    "Campo inválido: testProjectRef.",
    "欄位無效：testProjectRef。"
  ],
  "Invalid field: applicationUrl.": [
    "Campo inválido: applicationUrl.",
    "欄位無效：applicationUrl。"
  ],
  "Invalid field: callbackUrl.": [
    "Campo inválido: callbackUrl.",
    "欄位無效：callbackUrl。"
  ],
  "Invalid field: repositoryUrl.": [
    "Campo inválido: repositoryUrl.",
    "欄位無效：repositoryUrl。"
  ],
  "Invalid field: authentication.": [
    "Campo inválido: authentication.",
    "欄位無效：authentication。"
  ],
  "Application address: use a public HTTPS address without credentials, query parameters or fragments.": [
    "Endereço da aplicação: use um endereço HTTPS público sem credenciais, parâmetros de consulta ou fragmentos.",
    "應用程式位址：請使用不含憑證、查詢參數或片段的公開 HTTPS 位址。"
  ],
  "Callback address: use a public HTTPS address without credentials, query parameters or fragments.": [
    "Endereço de retorno: use um endereço HTTPS público sem credenciais, parâmetros de consulta ou fragmentos.",
    "回呼位址：請使用不含憑證、查詢參數或片段的公開 HTTPS 位址。"
  ],
  "Repository address: use a public HTTPS address without credentials, query parameters or fragments.": [
    "Endereço do repositório: use um endereço HTTPS público sem credenciais, parâmetros de consulta ou fragmentos.",
    "儲存庫位址：請使用不含憑證、查詢參數或片段的公開 HTTPS 位址。"
  ]
};
  const t=(source,values={},labels=[])=>{
    const pattern=lang==='en'?source:(dictionary[source]?.[lang==='pt'?0:1]||source);
    return String(pattern).replace(/\{(\w+)\}/g,(_,key)=>labels.includes(key)?t(String(values[key]??'')):String(values[key]??''));
  };
  const renderMessage=element=>{
    const spec=element.tcmsMessage;if(!spec)return;
    if(element.textContent!==spec.output){delete element.tcmsMessage;element.removeAttribute('data-i18n-message');return;}
    const value=t(spec.key,spec.values,spec.labels);if(element.textContent!==value)element.textContent=value;spec.output=value;
  };
  globalThis.TCMSI18n={t,renderMessage};
  function appearance(){document.documentElement.dataset.theme=theme==='system'?(media.matches?'dark':'light'):theme;}
  appearance();media.addEventListener('change',appearance);
  document.documentElement.lang=lang;
  document.addEventListener('DOMContentLoaded',()=>{
    const header=document.querySelector('header');if(!header)return;
    const account=document.querySelector('#account-summary');
    const controls=document.createElement('div');controls.className='portal-preferences';
    const languages=document.createElement('div');languages.className='segmented';languages.setAttribute('aria-label','Language');
    const themes=document.createElement('div');themes.className='segmented';themes.setAttribute('aria-label','Appearance');
    const languageButtons=[], themeButtons=[];
    for(const [code,label] of [['en','EN'],['pt','PT'],['zh-Hant','中文']]){
      const b=document.createElement('button');b.type='button';b.textContent=label;b.lang=code;
      b.addEventListener('click',()=>{lang=code;save('tcms-language',lang);translate();});languages.append(b);languageButtons.push([code,b]);
    }
    for(const [code,label] of [['light','☀'],['dark','☾'],['system','◐']]){
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.setAttribute('aria-label',code+' appearance');b.title=code+' appearance';
      b.addEventListener('click',()=>{theme=code;save('tcms-theme',theme);appearance();translate();});themes.append(b);themeButtons.push([code,b]);
    }
    controls.append(languages,themes);header.append(controls);if(account)header.append(account);
    const originals=new WeakMap();
    const originalTitle=document.title;
    // Translate only known interface labels, never form values or record content.
    function translate(){
      observer.disconnect();document.documentElement.lang=lang;document.title=originalTitle.split(' | ').map(part=>t(part)).join(' | ');
      for(const element of document.querySelectorAll('[data-i18n-message]'))renderMessage(element);
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;while(n=walker.nextNode()){
        if(n.parentElement.closest('script,style,input,textarea,[data-user-content],[data-i18n-message],.portal-preferences,#account-summary'))continue;

        const current=n.nodeValue.trim().replace(/\s+/g,' ');const previous=originals.get(n);
        const source=previous && (current===previous.source||current===previous.output)?previous.source:current;
        if(!dictionary[source])continue;
        const output=t(source);originals.set(n,{source,output});if(current!==output)n.nodeValue=output;
      }
      for(const element of document.querySelectorAll('[aria-label],[placeholder],[title]')){
        if(element.closest('[data-user-content],.portal-preferences'))continue;
        for(const attribute of ['aria-label','placeholder','title']){
          const value=element.getAttribute(attribute);if(!value)continue;
          const records=element.tcmsAttributeText||(element.tcmsAttributeText={});const old=records[attribute];
          const source=old&&value===old.output?old.source:value;
          if(dictionary[source]){const output=t(source);records[attribute]={source,output};if(value!==output)element.setAttribute(attribute,output);}
        }
      }
      for(const [code,b] of languageButtons)b.setAttribute('aria-pressed',String(code===lang));
      for(const [code,b] of themeButtons){b.setAttribute('aria-pressed',String(code===theme));b.title=t(code[0].toUpperCase()+code.slice(1)+' appearance');b.setAttribute('aria-label',b.title);}
      observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    }
    const observer=new MutationObserver(translate);translate();
  });
})();
