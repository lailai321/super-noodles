# 交接：Surface Go2 打印服务自启动排查

## 背景
这台 Surface Go2 跑一个 Node.js 脚本（`print-service.js`），每5秒轮询线上 API 拉新订单，发送 ESC/POS 指令到网络热敏打印机（IP `192.168.0.87:9100`）自动打印小票。代码仓库：https://github.com/lailai321/super-noodles （`print-service` 文件夹）。

## 当前问题
配置了"开机自动后台运行、不弹窗口"，但运行一段时间后 node 进程会消失，且看不出是怎么没的：
- `print-service.log`（脚本自己写的日志）里最后一条是 `network error: getaddrinfo enotfound www.supernoodlesonline.com.au`（DNS解析失败，大概是开机时WiFi还没连上），这条之后**完全没有更多日志**——按代码逻辑，这种网络错误会被捕获并每5秒重试，不应该让进程退出，所以怀疑是被外部杀掉的，不是代码自己崩的。
- 任务管理器搜"node"找不到进程，但任务计划程序里这个任务状态显示"Running"。

## 已经做过的尝试（按时间顺序）
1. 最早用"启动文件夹"放快捷方式 → 发现同时残留了两个快捷方式（一个直接指向会弹窗口的`start.bat`，一个指向隐藏运行的`start-silent.vbs`），互相打架，已清掉旧的。
2. 发现 Surface 默认有屏幕/睡眠超时，可能在后台杀进程 → 已让用户去"设置→系统→电源和电池→屏幕和睡眠"把"接通电源时"的两项改成"从不"（**需要现在重新确认这个设置是不是真的生效了**）。
3. 改用"任务计划程序(Task Scheduler)"代替启动文件夹，因为它有"失败自动重启"等选项 → 配置时遇到"Run whether user is logged on or not"需要管理员密码、staff账户权限不够等问题，最后切到管理员账户配置，触发器选"At startup"或"At log on"（具体选了哪个需要去任务计划程序里确认）。
4. 改用"Run only when user is logged on"避免存密码，但要确保任务绑定的账户是平时店里日常登录的那个账户，不是admin（**需要确认这一点**）。
5. `start.bat` 已改成无限重试循环（node崩了5秒后自动重启），并把输出重定向进 `print-service.log`（因为窗口被隐藏，看不到实时输出）。
6. 怀疑 `start-silent.vbs` 里 `shell.Run(path, 0, False)` 的 `False`（异步、不等待）导致 wscript.exe 很快退出，而 Task Scheduler 把整条进程树（wscript.exe + cmd.exe + node.exe）打包在一个 job 里追踪，wscript.exe 退出后系统可能把整条进程树一起清掉 → 已改成 `shell.Run(path, 0, True)`（同步等待）尝试解决，**但用户反馈"还是不行"，所以这个假设可能不对，或者改的文件没有被正确替换/任务里的路径没对上**。
7. 任务计划程序的"历史记录(History)"标签默认是空的（Windows默认关闭历史记录功能），刚才让用户去"操作菜单→启用所有任务历史记录"打开它，再手动右键任务→Run触发一次，但还没看到结果就转到这边来了。

## 现成的代码文件（在 GitHub 仓库 print-service/ 文件夹）
- `print-service.js` — 主脚本，已有自动失败上报、日志精简
- `start.bat` — 无限重试循环 + 日志写入文件
- `start-silent.vbs` — 用 wscript 隐藏窗口启动 start.bat（最新版用同步等待）
- `test-print.js` — 手动测试打印机连通性的脚本，不走真实订单

## 建议接下来排查方向
1. 先确认 Surface 上实际跑的文件路径，跟任务计划程序 Actions 标签里"添加参数"填的路径是否完全一致（路径不对会静默失败）
2. 打开任务历史记录后，手动 Run 一次，看 History 标签具体的事件和时间戳，搞清楚到底是"从来没启动成功"还是"启动后又被杀"
3. 如果怀疑还是被系统杀进程：检查电源设置是否真的生效；也可以检查 Windows 事件查看器(Event Viewer)里 System 日志，搜索任务结束时间点附近有没有相关系统事件（比如休眠/重启/更新）
4. 也可以考虑换更简单粗暴的方案兜底：比如用一个独立的"看门狗"任务，每分钟检查一次 node 进程是否存在，不存在就重新拉起来（不依赖 Task Scheduler 的复杂触发器逻辑）

## 用户状态
非技术背景新手，需要给出具体到"点哪个菜单、填什么"的步骤，不要假设她知道任何 Windows 系统管理术语。她已经因为这个问题反复折腾很久，比较疲惫，希望尽快有个稳定方案，不想再来回排查太多轮。
