export type Lang = "zh" | "en";

export const translations = {
  // Nav
  "nav.home": { zh: "首页", en: "Home" },
  "nav.workspace": { zh: "工作台", en: "Workspace" },
  "nav.brand": { zh: "证据盒", en: "EvidenceBox" },

  // Landing page - Hero
  "hero.badge": { zh: "社会服务赛道", en: "Social Service Track" },
  "hero.title": { zh: "EvidenceBox 证据盒", en: "EvidenceBox" },
  "hero.subtitle": { zh: "把混乱材料变成可执行方案", en: "Turn chaotic materials into actionable plans" },
  "hero.desc1": { zh: "当聊天记录、截图、票据、录音碎片堆积如山，你不是缺信息，而是缺", en: "When chat logs, screenshots, receipts, and audio fragments pile up, you don't lack information — you lack the ability to " },
  "hero.desc2": { zh: "把信息变成行动", en: "turn information into action" },
  "hero.desc3": { zh: "的能力。", en: "." },
  "hero.cta.enter": { zh: "进入工作台", en: "Enter Workspace" },
  "hero.cta.learn": { zh: "了解核心功能", en: "Learn More" },
  "hero.scroll": { zh: "↓ 向下滚动", en: "↓ Scroll down" },

  // Problem section
  "problem.tag": { zh: "问题洞察", en: "Problem Insight" },
  "problem.title": { zh: "为什么我们需要 EvidenceBox？", en: "Why Do We Need EvidenceBox?" },
  "problem.desc": { zh: "普通人遇到复杂事情时，往往卡在整理阶段，越拖越乱。信息就在那里，却始终无法变成行动。", en: "When ordinary people face complex situations, they often get stuck at the organizing stage. The more they delay, the messier it gets. The information is right there, but it never turns into action." },
  "problem.insight": { zh: "核心洞察：", en: "Core Insight: " },
  "problem.insight.desc": { zh: "大多数人并不是缺少信息，而是缺少把信息变成行动的能力。聊天记录、截图、票据、录音转写、合同片段，这些零散材料散落在各处，手动整理耗时耗力，还容易遗漏重点。", en: "Most people don't lack information — they lack the ability to turn information into action. Chat logs, screenshots, receipts, audio transcriptions, and contract fragments are scattered everywhere. Manual organizing is time-consuming and prone to missing key points." },
  "problem.imgCaption": { zh: "图：不同人群在日常中面临的信息整理困境", en: "Different groups facing information overload in daily life" },

  // Features section
  "features.tag": { zh: "核心功能", en: "Core Features" },
  "features.title": { zh: "上传材料，四步自动生成行动方案", en: "Upload Materials, Auto-Generate Action Plan" },
  "features.desc": { zh: "EvidenceBox 不是简单的文件存储，而是帮你从混乱中提取秩序的智能助手。", en: "EvidenceBox is not just file storage — it's a smart assistant that extracts order from chaos." },
  "features.timeline.title": { zh: "智能时间线", en: "Smart Timeline" },
  "features.timeline.desc": { zh: "自动按时间顺序排列所有材料，清晰呈现事件发展脉络，再也不用在聊天记录里翻找上下文。", en: "Automatically arrange all materials in chronological order, clearly showing how events unfold. No more scrolling through chat logs for context." },
  "features.summary.title": { zh: "关键摘要", en: "Key Summary" },
  "features.summary.desc": { zh: "从海量碎片中提取核心信息，生成一句话摘要和要点列表，5 秒掌握全貌。", en: "Extract core information from massive fragments, generate a one-line summary and key points. Grasp the big picture in 5 seconds." },
  "features.todos.title": { zh: "待办清单", en: "Todo List" },
  "features.todos.desc": { zh: "自动识别材料中需要跟进的事项，生成可勾选的任务列表，让行动一目了然。", en: "Automatically identify action items from materials, generate a checkable task list. Make actions clear at a glance." },
  "features.suggestions.title": { zh: "下一步建议", en: "Next Steps" },
  "features.suggestions.desc": { zh: "基于整理结果，给出具体的后续行动建议，帮你从「知道」走向「做到」。", en: "Based on the organized results, provide specific action recommendations. Help you go from 'knowing' to 'doing'." },

  // How it works
  "how.tag": { zh: "使用流程", en: "How It Works" },
  "how.title": { zh: "三步完成，零学习成本", en: "Three Steps, Zero Learning Curve" },
  "how.desc": { zh: "无需复杂设置，像发邮件一样简单。", en: "No complex setup needed. As simple as sending an email." },
  "how.step1.title": { zh: "丢入材料", en: "Drop Materials" },
  "how.step1.desc": { zh: "拖拽上传聊天记录、截图、PDF、音频文件，支持批量导入，什么格式都能丢。", en: "Drag and upload chat logs, screenshots, PDFs, and audio files. Batch import supported. Accept any format." },
  "how.step2.title": { zh: "自动分析", en: "Auto Analyze" },
  "how.step2.desc": { zh: "系统自动识别时间、人物、事件、关键语句，AI 完成繁琐的整理工作。", en: "The system automatically identifies dates, people, events, and key statements. The engine handles the tedious organizing work." },
  "how.step3.title": { zh: "获取方案", en: "Get Your Plan" },
  "how.step3.desc": { zh: "瞬间获得时间线、摘要、待办清单和行动建议，一键导出或分享。", en: "Instantly get timeline, summary, todo list, and action suggestions. Export or share with one click." },

  // Users section
  "users.tag": { zh: "目标用户", en: "Target Users" },
  "users.title": { zh: "谁最需要 EvidenceBox？", en: "Who Needs EvidenceBox Most?" },
  "users.desc": { zh: "任何遇到信息很乱、不知道先做什么的人，都能从中受益。", en: "Anyone facing messy information and not knowing what to do first can benefit." },
  "users.student.tag": { zh: "学生群体", en: "Students" },
  "users.student.title": { zh: "在校学生", en: "Students" },
  "users.student.1": { zh: "整理课程群里的通知、作业要求、deadline", en: "Organize course notifications, assignment requirements, and deadlines" },
  "users.student.2": { zh: "梳理小组讨论的聊天记录和分工", en: "Sort through group discussion logs and task assignments" },
  "users.student.3": { zh: "准备材料时汇总各处搜集的碎片信息", en: "Compile fragmented information from various sources when preparing materials" },
  "users.worker.tag": { zh: "职场人士", en: "Professionals" },
  "users.worker.title": { zh: "上班族", en: "Office Workers" },
  "users.worker.1": { zh: "整理客户沟通记录和项目进展", en: "Organize client communication records and project progress" },
  "users.worker.2": { zh: "汇总跨部门协作的邮件、截图、文档", en: "Summarize cross-department emails, screenshots, and documents" },
  "users.worker.3": { zh: "处理报销票据和出差凭证", en: "Process reimbursement receipts and travel vouchers" },
  "users.family.tag": { zh: "家庭用户", en: "Home Users" },
  "users.family.title": { zh: "家庭用户", en: "Home Users" },
  "users.family.1": { zh: "整理维权投诉的相关证据材料", en: "Organize evidence materials for complaints and rights protection" },
  "users.family.2": { zh: "记录和跟进家庭事务的处理进度", en: "Record and track the progress of household affairs" },
  "users.family.3": { zh: "保存重要的合同、票据、沟通记录", en: "Save important contracts, receipts, and communication records" },

  // Pain points
  "pain.title": { zh: "典型痛点场景", en: "Common Pain Points" },
  "pain.find.title": { zh: "翻找困难", en: "Hard to Find" },
  "pain.find.desc": { zh: "材料散落在微信、邮件、相册、备忘录里，急用时根本找不到。", en: "Materials scattered across WeChat, email, albums, and notes. Impossible to find when needed." },
  "pain.time.title": { zh: "整理耗时", en: "Time-Consuming" },
  "pain.time.desc": { zh: "手动截图、复制、分类、记录，处理一批材料要花好几个小时。", en: "Manual screenshotting, copying, categorizing, and recording takes hours for one batch." },
  "pain.miss.title": { zh: "遗漏重点", en: "Missing Key Points" },
  "pain.miss.desc": { zh: "信息太多，手工整理容易漏掉关键细节，影响后续决策。", en: "Too much information. Manual organizing easily misses key details, affecting decisions." },
  "pain.act.title": { zh: "难以行动", en: "Hard to Act" },
  "pain.act.desc": { zh: "材料堆在那里，却不知道下一步该做什么，问题一直拖着。", en: "Materials pile up, but you don't know what to do next. Problems keep dragging on." },

  // Value section
  "value.tag": { zh: "价值与意义", en: "Value & Impact" },
  "value.title": { zh: "不只是工具，更是能力的延伸", en: "Not Just a Tool, an Extension of Ability" },
  "value.desc": { zh: "EvidenceBox 的价值体现在效率提升和社会价值两个层面。", en: "EvidenceBox delivers value through efficiency gains and social impact." },
  "value.efficiency.title": { zh: "效率提升", en: "Efficiency" },
  "value.efficiency.1": { zh: "将数小时的材料整理工作压缩至几分钟", en: "Compress hours of organizing into minutes" },
  "value.efficiency.2": { zh: "减少重复劳动，让用户专注于真正重要的事情", en: "Reduce repetitive work, let users focus on what matters" },
  "value.efficiency.3": { zh: "降低信息遗漏风险，提升决策质量", en: "Reduce information omission risk, improve decision quality" },
  "value.efficiency.4": { zh: "支持一键导出，方便分享和存档", en: "One-click export for easy sharing and archiving" },
  "value.social.title": { zh: "社会价值", en: "Social Value" },
  "value.social.1": { zh: "让普通人面对复杂材料时也能从容应对", en: "Empower ordinary people to handle complex materials with ease" },
  "value.social.2": { zh: "降低信息整理的认知门槛和技术门槛", en: "Lower the cognitive and technical barriers to information organizing" },
  "value.social.3": { zh: "帮助用户在维权、申诉、协商中获得更清晰有力的材料", en: "Help users get clearer, stronger materials for rights protection, appeals, and negotiations" },
  "value.social.4": { zh: "用技术赋能让「秩序」不再是少数人的特权", en: "Use technology to make 'order' no longer a privilege of the few" },

  // Manifesto
  "manifesto.1": { zh: "这个项目不是做一个", en: "This project isn't about building something that " },
  "manifesto.2": { zh: "看起来很炫", en: "looks flashy" },
  "manifesto.3": { zh: "的工具，", en: ", " },
  "manifesto.4": { zh: "而是做一个真正能帮人", en: "but a tool that truly helps people " },
  "manifesto.5": { zh: "把混乱变成秩序", en: "turn chaos into order" },
  "manifesto.6": { zh: "的工具。", en: "." },
  "manifesto.author": { zh: "— EvidenceBox 产品理念", en: "— EvidenceBox Product Philosophy" },

  // CTA
  "cta.title": { zh: "准备好整理你的第一份材料了吗？", en: "Ready to Organize Your First Set of Materials?" },
  "cta.desc": { zh: "EvidenceBox 已就绪，期待与你一起把混乱变成秩序。", en: "EvidenceBox is ready. Let's turn chaos into order together." },
  "cta.button": { zh: "立即开始使用", en: "Get Started Now" },

  // Footer
  "footer": { zh: "EvidenceBox 证据盒 · 社会服务赛道创意方案", en: "EvidenceBox · Social Service Track Project" },

  // Workspace - Case list
  "cases.title": { zh: "我的案件", en: "My Cases" },
  "cases.subtitle": { zh: "管理和整理你的材料包", en: "Manage and organize your material packages" },
  "cases.new": { zh: "新建案件", en: "New Case" },
  "cases.empty.title": { zh: "还没有案件", en: "No Cases Yet" },
  "cases.empty.desc": { zh: "点击「新建案件」开始整理你的材料", en: "Click 'New Case' to start organizing your materials" },
  "cases.empty.cta": { zh: "新建第一个案件", en: "Create Your First Case" },
  "cases.dialog.title": { zh: "新建案件", en: "New Case" },
  "cases.dialog.desc": { zh: "为你的材料包起一个名字，比如「租房纠纷整理」或「项目材料汇总」", en: "Give your material package a name, e.g., 'Rental Dispute' or 'Project Summary'" },
  "cases.dialog.label": { zh: "案件标题", en: "Case Title" },
  "cases.dialog.placeholder": { zh: "输入案件标题...", en: "Enter case title..." },
  "cases.dialog.cancel": { zh: "取消", en: "Cancel" },
  "cases.dialog.create": { zh: "创建", en: "Create" },
  "cases.dialog.creating": { zh: "创建中...", en: "Creating..." },
  "cases.open": { zh: "打开", en: "Open" },
  "cases.delete.title": { zh: "确认删除", en: "Confirm Delete" },
  "cases.delete.desc": { zh: "删除后无法恢复，案件及其所有材料将被永久删除。", en: "This cannot be undone. The case and all its materials will be permanently deleted." },
  "cases.delete.confirm": { zh: "确认删除", en: "Delete" },

  // Status
  "status.created": { zh: "已创建", en: "Created" },
  "status.uploading": { zh: "上传中", en: "Uploading" },
  "status.extracting": { zh: "提取中", en: "Extracting" },
  "status.analyzing": { zh: "分析中", en: "Analyzing" },
  "status.ready": { zh: "已完成", en: "Completed" },
  "status.failed": { zh: "失败", en: "Failed" },

  // Case workspace
  "case.back": { zh: "返回案件列表", en: "Back to Cases" },
  "case.notFound": { zh: "案件不存在", en: "Case not found" },
  "case.backToList": { zh: "返回案件列表", en: "Back to Cases" },
  "case.upload.title": { zh: "上传材料", en: "Upload Materials" },
  "case.materials.title": { zh: "材料列表", en: "Materials" },
  "case.materials.count": { zh: "个文件", en: "files" },
  "case.analyze": { zh: "开始分析", en: "Analyze" },
  "case.analyzing": { zh: "分析中...", en: "Analyzing..." },
  "case.reanalyze": { zh: "重新分析", en: "Re-analyze" },
  "case.reanalyzing": { zh: "重新分析中...", en: "Re-analyzing..." },

  // Progress
  "progress.upload": { zh: "上传材料", en: "Upload" },
  "progress.extract": { zh: "提取文本", en: "Extract" },
  "progress.analyze": { zh: "分析整理", en: "Analyze" },
  "progress.done": { zh: "完成", en: "Done" },

  // Upload dropzone
  "upload.drag": { zh: "拖拽文件到此处，或点击选择文件", en: "Drag files here, or click to select" },
  "upload.dragActive": { zh: "松开鼠标即可上传", en: "Release to upload" },
  "upload.supported": { zh: "支持 PNG / JPG / PDF / TXT / CSV，单个文件最大 20MB", en: "Supports PNG / JPG / PDF / TXT / CSV, max 20MB per file" },
  "upload.failed": { zh: "上传失败", en: "Upload failed" },

  // Material list
  "material.uploaded": { zh: "待处理", en: "Pending" },
  "material.extracting": { zh: "提取中", en: "Extracting" },
  "material.extracted": { zh: "已提取", en: "Extracted" },
  "material.failed": { zh: "失败", en: "Failed" },
  "material.empty": { zh: "还没有上传材料，请先拖拽文件到上方上传区", en: "No materials uploaded yet. Drag files to the upload area above." },

  // Result tabs
  "result.title": { zh: "分析结果", en: "Analysis Results" },
  "result.export": { zh: "导出 Markdown", en: "Export Markdown" },
  "result.loading": { zh: "正在分析材料...", en: "Analyzing materials..." },
  "result.empty": { zh: "暂无分析结果", en: "No analysis results yet" },
  "result.empty.desc": { zh: "上传材料后点击\"开始分析\"按钮", en: "Upload materials and click 'Analyze'" },
  "result.tab.timeline": { zh: "时间线", en: "Timeline" },
  "result.tab.summary": { zh: "摘要", en: "Summary" },
  "result.tab.todos": { zh: "待办", en: "Todos" },
  "result.tab.suggestions": { zh: "建议", en: "Suggestions" },

  // Timeline view
  "timeline.empty": { zh: "未检测到时间信息", en: "No timeline data detected" },
  "timeline.empty.desc": { zh: "上传的材料中未找到可识别的日期，请尝试上传包含日期的文本", en: "No recognizable dates found in uploaded materials. Try uploading text with dates." },
  "timeline.source": { zh: "来源", en: "Source" },
  "timeline.normalized": { zh: "标准化", en: "Normalized" },

  // Summary view
  "summary.empty": { zh: "暂无摘要信息", en: "No summary available" },
  "summary.empty.desc": { zh: "分析完成后将显示摘要内容", en: "Summary will appear after analysis completes" },
  "summary.oneline": { zh: "一句话摘要", en: "One-Line Summary" },
  "summary.keypoints": { zh: "关键要点", en: "Key Points" },
  "summary.keywords": { zh: "关键词", en: "Keywords" },

  // Todos view
  "todos.empty": { zh: "未检测到待办事项", en: "No todos detected" },
  "todos.empty.desc": { zh: "上传的材料中未找到包含指令性语句的内容", en: "No action items found in the uploaded materials" },
  "todos.high": { zh: "高优先级", en: "High Priority" },
  "todos.medium": { zh: "中优先级", en: "Medium Priority" },
  "todos.low": { zh: "低优先级", en: "Low Priority" },
  "todos.due": { zh: "截止", en: "Due" },

  // Suggestions view
  "suggestions.empty": { zh: "暂无建议", en: "No suggestions available" },
  "suggestions.empty.desc": { zh: "分析完成后将根据材料内容生成行动建议", en: "Action suggestions will be generated after analysis" },
  "suggestions.why": { zh: "为什么建议：", en: "Why: " },
  "suggestions.how": { zh: "具体怎么做：", en: "How: " },
  "suggestions.priority.high": { zh: "紧急", en: "Urgent" },
  "suggestions.priority.medium": { zh: "重要", en: "Important" },
  "suggestions.priority.low": { zh: "建议", en: "Suggested" },

  // Export
  "export.title": { zh: "分析报告", en: "Analysis Report" },
  "export.generated": { zh: "由 EvidenceBox 证据盒自动生成", en: "Auto-generated by EvidenceBox" },
  "export.timeline": { zh: "时间线", en: "Timeline" },
  "export.summary": { zh: "关键摘要", en: "Key Summary" },
  "export.todos": { zh: "待办清单", en: "Todo List" },
  "export.suggestions": { zh: "下一步建议", en: "Next Steps" },
  "export.oneline": { zh: "一句话摘要", en: "One-Line Summary" },
  "export.keypoints": { zh: "关键要点", en: "Key Points" },
  "export.keywords": { zh: "关键词", en: "Keywords" },
  "export.event": { zh: "事件", en: "Event" },
  "export.detail": { zh: "详情", en: "Detail" },
  "export.source": { zh: "来源", en: "Source" },
  "export.noTimeline": { zh: "未检测到时间信息", en: "No timeline data" },
  "export.noTodos": { zh: "未检测到待办事项", en: "No todos detected" },
  "export.noSuggestions": { zh: "暂无建议", en: "No suggestions" },
  "export.priority": { zh: "优先级", en: "Priority" },
  "export.deadline": { zh: "截止", en: "Due" },

  // API errors
  "error.caseNotFound": { zh: "案件不存在", en: "Case not found" },
  "error.noMaterials": { zh: "案件中没有材料，请先上传文件", en: "No materials in this case. Please upload files first." },
  "error.titleEmpty": { zh: "案件标题不能为空", en: "Case title cannot be empty" },
  "error.unsupportedType": { zh: "不支持的文件类型", en: "Unsupported file type" },
  "error.fileTooLarge": { zh: "文件大小超过限制（最大20MB）", en: "File size exceeds limit (max 20MB)" },
  "error.noFile": { zh: "未找到文件", en: "No file found" },
  "error.noCaseId": { zh: "缺少案件ID", en: "Missing case ID" },
  "error.analyzeFailed": { zh: "分析失败", en: "Analysis failed" },
  "error.uploadFailed": { zh: "上传文件失败", en: "File upload failed" },
  "error.createFailed": { zh: "创建案件失败", en: "Failed to create case" },
  "error.deleteFailed": { zh: "删除案件失败", en: "Failed to delete case" },
  "error.getCaseFailed": { zh: "获取案件详情失败", en: "Failed to get case details" },
  "error.getCaseListFailed": { zh: "获取案件列表失败", en: "Failed to get case list" },
  "error.getStatusFailed": { zh: "获取状态失败", en: "Failed to get status" },

  // SSE messages
  "sse.created": { zh: "案件已创建", en: "Case created" },
  "sse.uploading": { zh: "正在上传材料", en: "Uploading materials" },
  "sse.extracting": { zh: "正在提取文本", en: "Extracting text" },
  "sse.analyzing": { zh: "正在分析材料", en: "Analyzing materials" },
  "sse.ready": { zh: "分析完成", en: "Analysis complete" },
  "sse.failed": { zh: "分析失败", en: "Analysis failed" },
} as const;

export type TranslationKey = keyof typeof translations;
