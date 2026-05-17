// 使用匿名自执行函数，确保一被 import 进网页就立刻执行
(function() {
    console.log("【楼层隐藏助手】========== 远程云端脚本开始加载 ==========");

    // 1. UI 面板（纯净版）
    const extensionHtml = `
    <div class="extension-settings" id="my_floor_controller_panel">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>楼层隐藏助手</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container" style="justify-content: space-between; gap: 10px;">
                    <div style="flex: 1;">
                        <label for="floor_start_input">起始楼层:</label>
                        <input id="floor_start_input" class="text_pole" type="number" min="0" value="0">
                    </div>
                    <div style="flex: 1;">
                        <label for="floor_end_input">结束楼层:</label>
                        <input id="floor_end_input" class="text_pole" type="number" min="0" value="0">
                    </div>
                </div>
                <div class="flex-container" style="margin-top: 15px; gap: 10px;">
                    <div id="btn_hide_floor" class="menu_button" style="flex: 1; white-space: nowrap; text-align: center;">隐藏区间</div>
                    <div id="btn_show_floor" class="menu_button" style="flex: 1; white-space: nowrap; text-align: center;">显示区间</div>
                </div>
            </div>
        </div>
    </div>
    `;

    // 2. 注入面板：死等酒馆扩展菜单准备好
    let injectTimer = setInterval(() => {
        const container = document.getElementById('extensions_settings');
        if (container) {
            clearInterval(injectTimer);
            if (!document.getElementById('my_floor_controller_panel')) {
                $(container).append(extensionHtml);
                
                // 绑定按钮事件
                $('#btn_hide_floor').on('click', () => executeSlashCommand(true));
                $('#btn_show_floor').on('click', () => executeSlashCommand(false));
                console.log("【楼层隐藏助手】========== 远程 UI 面板注入成功 ==========");
            }
        }
    }, 500);

    // 3. 核心功能：使用代理发送斜杠命令（绝对稳定）
    function executeSlashCommand(isHide) {
        const startNum = parseInt($('#floor_start_input').val(), 10);
        const endNum = parseInt($('#floor_end_input').val(), 10);

        if (isNaN(startNum) || isNaN(endNum) || startNum < 0 || endNum < 0) {
            return toastr.error("请输入有效的楼层数字！");
        }

        const minFloor = Math.min(startNum, endNum);
        const maxFloor = Math.max(startNum, endNum);
        const commandText = isHide ? `/hide ${minFloor}-${maxFloor}` : `/unhide ${minFloor}-${maxFloor}`;

        const textarea = document.getElementById('send_textarea');
        const sendBtn = document.getElementById('send_but');

        if (!textarea || !sendBtn) {
            return toastr.error("致命错误：找不到聊天输入框或发送按钮！");
        }

        const originalText = textarea.value;
        textarea.value = commandText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        sendBtn.click();

        setTimeout(() => {
            if (originalText && originalText.trim() !== '') {
                textarea.value = originalText;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            toastr.success(`已成功代为执行：${commandText}`);
        }, 200);
    }
})();