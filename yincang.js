(function() {
    console.log("【楼层隐藏助手】========== 输入框左侧挂载版已启动 ==========");

    // 1. 定义我们要在左侧快捷菜单里显示的“圆形小按钮”
    // 注意：点击这个圆形按钮后，会弹出一个漂亮的独立小窗口（Flex-Modal）让你输入区间
    const myButtonHtml = `
        <div id="btn_floor_helper_trigger" class="fa-solid fa-eye-slash" title="楼层隐藏助手" 
             style="font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; margin: 2px;">
        </div>
    `;

    // 2. 定义弹出的输入控制面板样式（完美契合酒馆主题）
    const myModalHtml = `
    <div id="floor_helper_modal" style="display: none; position: absolute; bottom: 60px; left: 10px; z-index: 9999; background: var(--mainColor); border: 1px solid var(--borderColor); padding: 15px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 260px;">
        <div style="font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span>层隐藏助手</span>
            <span id="btn_floor_helper_close" style="cursor: pointer; opacity: 0.6;">✕</span>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
            <div style="flex: 1;">
                <label style="font-size: 0.8rem; display:block; margin-bottom:4px;">起始楼层:</label>
                <input id="floor_start_input" class="text_pole" type="number" min="0" value="0" style="width: 100%;">
            </div>
            <div style="flex: 1;">
                <label style="font-size: 0.8rem; display:block; margin-bottom:4px;">结束楼层:</label>
                <input id="floor_end_input" class="text_pole" type="number" min="0" value="0" style="width: 100%;">
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <div id="btn_hide_floor" class="menu_button" style="flex: 1; text-align: center; white-space: nowrap; padding: 5px 0;">隐藏区间</div>
            <div id="btn_show_floor" class="menu_button" style="flex: 1; text-align: center; white-space: nowrap; padding: 5px 0;">显示区间</div>
        </div>
    </div>
    `;

    // 3. 绝杀技：死等输入框左侧的快捷按钮栏（#external_plugins_dropdown）加载出来
    let injectTimer = setInterval(() => {
        // 酒馆助手或者快捷回复按钮通常挂载在这些容器里
        const container = document.getElementById('external_plugins_dropdown') || document.querySelector('.shadow_element') || document.getElementById('extensions_menu');
        const inputArea = document.getElementById('form_container'); // 用来挂载弹出窗口的父级

        if (container && inputArea) {
            clearInterval(injectTimer);

            // 如果还没添加过，就强行塞进去
            if (!document.getElementById('btn_floor_helper_trigger')) {
                // 把眼睛斜线图标 👁️‍🗨️ 塞进左侧按钮栏
                $(container).append(myButtonHtml);
                // 把弹出的控制输入框塞进输入框附近
                $(inputArea).append(myModalHtml);

                // --- 绑定交互事件 ---
                // 点击左侧小图标，切换面板的显示/隐藏
                $('#btn_floor_helper_trigger').on('click', (e) => {
                    e.stopPropagation();
                    $('#floor_helper_modal').toggle();
                });

                // 点击弹窗的 ✕ 号关闭面板
                $('#btn_floor_helper_close').on('click', () => {
                    $('#floor_helper_modal').hide();
                });

                // 点击空白处自动关闭面板
                $(document).on('click', (e) => {
                    if (!$(e.target).closest('#floor_helper_modal').length && !$(e.target).closest('#btn_floor_helper_trigger').length) {
                        $('#floor_helper_modal').hide();
                    }
                });

                // 绑定隐藏/显示区间功能
                $('#btn_hide_floor').on('click', () => executeSlashCommand(true));
                $('#btn_show_floor').on('click', () => executeSlashCommand(false));

                console.log("【楼层隐藏助手】========== 左侧小按钮与弹窗注入成功！ ==========");
            }
        }
    }, 500);

    // 4. 核心功能：代理原生斜杠命令
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
            return toastr.error("致命错误：找不到聊天输入框！");
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
            $('#floor_helper_modal').hide(); // 执行完自动收起面板
            toastr.success(`已代为执行：${commandText}`);
        }, 200);
    }
})();
