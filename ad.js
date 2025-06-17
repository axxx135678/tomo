// ==UserScript==
// @name         Magical Variable Updater
// @version      1.3.3-hotfix
// @description  Adds _.set support for variable manipulation and a dynamic status bar.
// @author       MagicalAstrogy (Original), Modified by AI Assistant
// @match        *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 辅助函数 (保持不变) ---
    function t(str) { if (typeof str !== 'string') return str; return str.replace(/^[\s"'`]*(.*?)[\s"'`]*$/, "$1"); }
    function e(str, startIndex) { let a = 1, s = !1, n = ""; for (let r = startIndex; r < str.length; r++) { const e_char = str[r], o = r > 0 ? str[r - 1] : ""; if ('"' !== e_char && "'" !== e_char && "`" !== e_char || "\\" === o || (s ? e_char === n && (s = !1) : (s = !0, n = e_char)), !s) if ("(" === e_char) a++; else if (")" === e_char && (a--, 0 === a)) return r } return -1 }
    function a(str) { const e_arr = []; let a_curr = "", s_in_quote = !1, n_quote_char = "", r_bracket_depth = 0, o_brace_depth = 0; for (let i = 0; i < str.length; i++) { const l_char = str[i]; if ('"' !== l_char && "'" !== l_char && "`" !== l_char || 0 !== i && "\\" === str[i - 1] || (s_in_quote ? l_char === n_quote_char && (s_in_quote = !1) : (s_in_quote = !0, n_quote_char = l_char)), "[" === l_char && r_bracket_depth++, "]" === l_char && r_bracket_depth--, "{" === l_char && o_brace_depth++, "}" === l_char && o_brace_depth--, "," !== l_char || s_in_quote || 0 !== r_bracket_depth || 0 !== o_brace_depth ? a_curr += l_char : (e_arr.push(a_curr.trim()), a_curr = "")) } a_curr.trim() && e_arr.push(a_curr.trim()); return e_arr }
    function s(pathStr) { if (typeof pathStr !== 'string') return ''; const e_parts = []; let a_curr = "", s_in_quote = !1, n_quote_char = ""; for (let r = 0; r < pathStr.length; r++) { const o_char = pathStr[r]; if ('"' !== o_char && "'" !== o_char || 0 !== r && "\\" === pathStr[r - 1] ? "." !== o_char || s_in_quote ? a_curr += o_char : (e_parts.push(a_curr), a_curr = "") : s_in_quote ? o_char === n_quote_char ? s_in_quote = !1 : a_curr += o_char : (s_in_quote = !0, n_quote_char = o_char), '"' === o_char && s_in_quote && pathStr[r-1] !== '\\') { /* handle escaped quotes if needed, current logic is simple */ } } a_curr && e_parts.push(a_curr); return e_parts.join(".") }

    // --- 核心更新函数 n() ---
    async function n(ai_reply_content, data_obj_to_update) {
        // 【修改点 N.1】确保 data_obj_to_update 和其核心属性是对象
        if (typeof data_obj_to_update !== 'object' || data_obj_to_update === null) data_obj_to_update = {};
        if (typeof data_obj_to_update.stat_data !== 'object' || data_obj_to_update.stat_data === null) data_obj_to_update.stat_data = {};
        if (typeof data_obj_to_update.display_data !== 'object' || data_obj_to_update.display_data === null) data_obj_to_update.display_data = {}; // 将被下面的克隆覆盖
        if (typeof data_obj_to_update.delta_data !== 'object' || data_obj_to_update.delta_data === null) data_obj_to_update.delta_data = {};
        
        await eventEmit(i.VARIABLE_UPDATE_STARTED, data_obj_to_update, false); // eventEmit flag is for other extensions, not directly used by this func's return

        // 【修改点 N.2】更安全地克隆 display_data (它现在应该是stat_data的副本，用于记录变更)
        // display_data_mirror 将用于记录变更的字符串版本，而 stat_data 将包含实际值
        var display_data_mirror_for_logging = _.cloneDeep(data_obj_to_update.stat_data); 
        var delta_data_for_this_turn = {};
        
        var parsed_set_commands = (function(text_content) { /* ... (解析逻辑保持1.3.2-hotfix版本) ... */
            const commands_found = []; let current_pos = 0;
            while (current_pos < text_content.length) {
                const set_start_index = text_content.indexOf("_.set(", current_pos);
                if (set_start_index === -1) break;
                const args_start_index = set_start_index + 6;
                let args_end_index = e(text_content, args_start_index);
                if (args_end_index === -1) { current_pos = args_start_index + 1; continue; }
                let command_end_index = args_end_index + 1;
                let reason_comment = "";
                if (command_end_index < text_content.length && text_content[command_end_index] === ";") {
                    for (command_end_index++; command_end_index < text_content.length && text_content[command_end_index] === " "; command_end_index++);
                    if (command_end_index + 1 < text_content.length && text_content[command_end_index] === "/" && text_content[command_end_index + 1] === "/") {
                        const newline_after_comment = text_content.indexOf("\n", command_end_index);
                        if (newline_after_comment !== -1) { reason_comment = text_content.substring(command_end_index + 2, newline_after_comment).trim(); command_end_index = newline_after_comment;
                        } else { reason_comment = text_content.substring(command_end_index + 2).trim(); command_end_index = text_content.length; }
                    }
                }
                const args_string = text_content.substring(args_start_index, args_end_index);
                const full_match_string = text_content.substring(set_start_index, command_end_index);
                const args_array = a(args_string);
                if (args_array.length > 0 && args_array[0] && args_array[0].trim() !== "") {
                    const path_val = t(args_array[0]);
                    if (path_val && path_val.trim() !== "") {
                        if (args_array.length >= 3) { commands_found.push({ fullMatch: full_match_string, path: path_val, oldValue: t(args_array[1]), newValue: t(args_array[2]), reason: reason_comment });
                        } else if (args_array.length === 2) { commands_found.push({ fullMatch: full_match_string, path: path_val, oldValue: t(args_array[1]), newValue: t(args_array[1]), reason: reason_comment });
                        } else { console.warn("MagVarUpdate (n-parser): _.set command had a valid path but not enough arguments:", full_match_string, "Parsed args:", args_array); }
                    } else { console.error("MagVarUpdate (n-parser): _.set command resulted in an EMPTY path after trimming quotes. Original command:", full_match_string, "Path before trim:", args_array[0]); }
                } else { console.error("MagVarUpdate (n-parser): _.set command could not be parsed correctly or had an EMPTY path. Original command:", full_match_string, "Parsed args:", args_array); }
                current_pos = command_end_index;
            }
            return commands_found;
        })(ai_reply_content);

        var any_var_updated_by_set = false; // 【修改点 N.3】返回值只基于是否有_.set成功
        for (const cmd of parsed_set_commands) { /* ... (循环内逻辑保持1.3.2-hotfix版本，但使用 any_var_updated_by_set) ... */
            var { path: var_path_str, oldValue: old_val_str, newValue: new_val_str, reason: reason_str } = cmd;
            var_path_str = s(var_path_str);
            if (var_path_str === '' || var_path_str === null || var_path_str === undefined) { console.error(`MagVarUpdate (n): Processed path is EMPTY for command. Original path: ${cmd.path}. Skipping set command:`, cmd.fullMatch); continue; }
            if (_.has(data_obj_to_update.stat_data, var_path_str) || old_val_str === 'undefined') {
                if (!_.has(data_obj_to_update.stat_data, var_path_str)) { console.info(`MagVarUpdate (n): Creating new entry for path: '${var_path_str}'`); }
                const value_before_update = _.get(data_obj_to_update.stat_data, var_path_str);
                let final_parsed_new_value;
                if (_.isString(new_val_str)) {
                    const trimmed_new_val = new_val_str.trim();
                    if ((trimmed_new_val.startsWith('{') && trimmed_new_val.endsWith('}')) || (trimmed_new_val.startsWith('[') && trimmed_new_val.endsWith(']'))) {
                        try { final_parsed_new_value = JSON.parse(trimmed_new_val); }
                        catch (err) { console.error(`MagVarUpdate (n): Failed to parse new value as JSON for path '${var_path_str}', falling back to string: ${new_val_str}. Error: ${err.message}`); final_parsed_new_value = t(new_val_str); }
                    } else { final_parsed_new_value = t(new_val_str); }
                } else { final_parsed_new_value = new_val_str; }
                _.set(data_obj_to_update.stat_data, var_path_str, final_parsed_new_value);
                const display_new_val = _.isObject(final_parsed_new_value) ? JSON.stringify(final_parsed_new_value) : final_parsed_new_value;
                const display_old_val = _.isObject(value_before_update) ? JSON.stringify(value_before_update) : value_before_update;
                const display_reason = reason_str ? `(${reason_str})` : "";
                const display_diff = `${display_old_val}->${display_new_val} ${display_reason}`;
                _.set(display_data_mirror_for_logging, var_path_str, display_diff); // 更新的是克隆出来的副本
                _.set(delta_data_for_this_turn, var_path_str, display_diff);
                any_var_updated_by_set = true; // 标记有更新
                console.info(`MagVarUpdate (n): Set '${var_path_str}' to '${display_new_val}' ${display_reason}`);
                await eventEmit(i.SINGLE_VARIABLE_UPDATED, data_obj_to_update.stat_data, var_path_str, value_before_update, final_parsed_new_value);
            } else { console.error(`MagVarUpdate (n): Path '${var_path_str}' was not found and creation was not explicitly requested with 'undefined'. Value: ${new_val_str}`); }
        }
        data_obj_to_update.display_data = display_data_mirror_for_logging; // 将记录了变更的副本赋值给display_data
        data_obj_to_update.delta_data = delta_data_for_this_turn;
        await eventEmit(i.VARIABLE_UPDATE_ENDED, data_obj_to_update, any_var_updated_by_set); // eventEmit flag is for other extensions
        return any_var_updated_by_set; // 【修改点 N.3】
    }

    // --- 生成结束事件处理函数 r() ---
    async function r() {
        console.log("MagVarUpdate (r): GENERATION_ENDED triggered.");
        const current_msg_id = await getLastMessageId();
        var messages_array = await getChatMessages(current_msg_id);

        if (messages_array.length === 0) { console.error("MagVarUpdate (r): No message found with ID:", current_msg_id); return; }
        var current_msg_obj = messages_array[0];
        if (current_msg_obj.role !== "assistant") { console.log("MagVarUpdate (r): Last message not from assistant. Skipping."); return; }

        var status_placeholder_added = false;
        var ai_message_content = current_msg_obj.message;
        
        const base_data_for_current_turn = await (async function(prev_msg_id_num) { /* ... (获取逻辑保持1.3.2-hotfix) ... */
            for (; !(prev_msg_id_num < 0); prev_msg_id_num--) {
                var prev_msgs_arr = await getChatMessages(prev_msg_id_num);
                if (prev_msgs_arr.length > 0 && prev_msgs_arr[0].data && _.has(prev_msgs_arr[0].data, "stat_data")) { console.log("MagVarUpdate (r): Found stat_data in previous message ID:", prev_msg_id_num); return prev_msgs_arr[0].data; }
            }
            console.log("MagVarUpdate (r): No stat_data in previous messages, falling back to getVariables().");
            return await getVariables();
        })(current_msg_id - 1);

        let i_data_for_processing;
        if (base_data_for_current_turn && typeof base_data_for_current_turn === 'object') {
            i_data_for_processing = _.cloneDeep(base_data_for_current_turn);
        } else {
            i_data_for_processing = {}; 
            console.warn("MagVarUpdate (r): Base data from previous turn/getVariables() was not a valid object. Initializing fresh i_data_for_processing.");
        }
        // 【修改点 R.1】 极度简化初始化，n()函数会自己处理
        if (typeof i_data_for_processing.stat_data !== 'object' || i_data_for_processing.stat_data === null) i_data_for_processing.stat_data = {};
        // display_data 和 delta_data 会在 n() 函数中被正确创建/赋值，这里不需要预先克隆 stat_data 给它们

        var variables_were_updated_by_n = await n(ai_message_content, i_data_for_processing);

        if (variables_were_updated_by_n) {
            console.log("MagVarUpdate (r): Variables were updated by n(). Running replaceVariables.");
            await replaceVariables(i_data_for_processing);
        }
        console.log("MagVarUpdate (r): Saving data to message ID:", current_msg_id); // 移除详细数据打印，减少日志
        await setChatMessage({ data: i_data_for_processing }, current_msg_id, { refresh: "none" });

        if (!ai_message_content.includes("<CharView") && !ai_message_content.includes("<StatusPlaceHolderImpl/>")) {
            if (ai_message_content.includes("<StatusPlaceHolder/>")) {
                ai_message_content = ai_message_content.replace("<StatusPlaceHolder/>", "<StatusPlaceHolderImpl/>"); status_placeholder_added = true;
            } else {
                ai_message_content += "\n\n" + "<StatusPlaceHolderImpl/>"; status_placeholder_added = true;
            }
        }
        if (status_placeholder_added) {
            console.info("MagVarUpdate (r): Adding/Replacing StatusPlaceHolderImpl in message text.");
            await setChatMessage({ message: ai_message_content }, current_msg_id, { refresh: "display_and_render_current" });
        }
        console.log("MagVarUpdate (r): GENERATION_ENDED finished.");
    }

    // --- 初始化函数 o() ---
    async function o() {
        console.log("MagVarUpdate (o): MESSAGE_SENT or GENERATION_STARTED triggered.");
        var messages_for_swipe_data_source = [];
        try { messages_for_swipe_data_source = await getChatMessages(-2, { role: "assistant", include_swipes: true }); } catch (e) {console.warn("MagVarUpdate (o): Failed to get -2 messages, trying message 0.", e)}
        if (!messages_for_swipe_data_source || messages_for_swipe_data_source.length === 0) { messages_for_swipe_data_source = await getChatMessages(0, { include_swipes: true }); }
        if (!messages_for_swipe_data_source || messages_for_swipe_data_source.length === 0) { console.error("MagVarUpdate (o): No messages found to initialize from. Exiting init."); return; }

        var latest_message_obj = messages_for_swipe_data_source[0];
        var swipe_data_obj = (latest_message_obj.swipes_data && latest_message_obj.swipes_data[latest_message_obj.swipe_id]) || {};
        
        var selected_global_lorebooks_arr = (await getLorebookSettings()).selected_global_lorebooks || [];
        var current_char_primary_lorebook = await getCurrentCharPrimaryLorebook();
        if (current_char_primary_lorebook !== null && !selected_global_lorebooks_arr.includes(current_char_primary_lorebook)) { selected_global_lorebooks_arr.push(current_char_primary_lorebook); }

        // 【修改点 O.1】确保核心属性是对象
        if (typeof swipe_data_obj !== 'object' || swipe_data_obj === null) swipe_data_obj = {};
        if (typeof swipe_data_obj.stat_data !== 'object' || swipe_data_obj.stat_data === null) swipe_data_obj.stat_data = {};
        // display_data 和 delta_data 会在 n() 中被赋值，这里不需要预处理
        if (!Array.isArray(swipe_data_obj.initialized_lorebooks)) swipe_data_obj.initialized_lorebooks = [];

        var initvar_was_processed = false;
        for (const lorebook_id of selected_global_lorebooks_arr) { /* ... (initvar 处理逻辑保持1.3.2-hotfix) ... */
            if (!swipe_data_obj.initialized_lorebooks.includes(lorebook_id)) {
                swipe_data_obj.initialized_lorebooks.push(lorebook_id);
                var lorebook_entries_arr = await getLorebookEntries(lorebook_id);
                for (const entry of lorebook_entries_arr) {
                    if (entry.comment?.toLowerCase().includes("[initvar]")) {
                        try { const parsed_initvar_json = JSON.parse(substitudeMacros(entry.content)); swipe_data_obj.stat_data = _.merge({}, swipe_data_obj.stat_data, parsed_initvar_json); initvar_was_processed = true; console.log("MagVarUpdate (o): Processed [initvar] from lorebook:", lorebook_id);
                        } catch (err) { console.error(`MagVarUpdate (o): Failed to parse JSON from [initvar] lorebook entry: ${err.message}`, entry); toastr.error(err.message, "Failed to parse [initvar] JSON", { timeOut: 7000 }); }
                    }
                }
            }
        }
        console.info("MagVarUpdate (o): Saving initial variables (stat_data etc.) globally via insertOrAssignVariables.");
        await insertOrAssignVariables(swipe_data_obj);

        if (latest_message_obj.swipes && Array.isArray(latest_message_obj.swipes)) { /* ... (swipe 处理逻辑保持1.3.2-hotfix，但确保传入 n 的第二个参数是对象) ... */
            console.log("MagVarUpdate (o): Processing swipes for message ID:", latest_message_obj.message_id, "Number of swipes:", latest_message_obj.swipes.length);
            for (var swipe_idx = 0; swipe_idx < latest_message_obj.swipes.length; swipe_idx++) {
                var cloned_data_for_swipe = _.cloneDeep(swipe_data_obj);
                // 确保 n 函数的第二个参数总是包含 stat_data, display_data, delta_data 作为对象
                if (typeof cloned_data_for_swipe.stat_data !== 'object' || cloned_data_for_swipe.stat_data === null) cloned_data_for_swipe.stat_data = {};
                if (typeof cloned_data_for_swipe.display_data !== 'object' || cloned_data_for_swipe.display_data === null) cloned_data_for_swipe.display_data = {};
                if (typeof cloned_data_for_swipe.delta_data !== 'object' || cloned_data_for_swipe.delta_data === null) cloned_data_for_swipe.delta_data = {};
                
                await n(substitudeMacros(latest_message_obj.swipes[swipe_idx]), cloned_data_for_swipe);
                console.log(`MagVarUpdate (o): Saving data for swipe ${swipe_idx} of message ID ${latest_message_obj.message_id}.`);
                await setChatMessage({ data: cloned_data_for_swipe }, latest_message_obj.message_id, { refresh: "none", swipe_id: swipe_idx });
            }
        } else { console.log("MagVarUpdate (o): No swipes found or latest_message_obj.swipes is not an array for message ID:", latest_message_obj.message_id); }
        
        const u_lore_settings = { context_percentage: 100, recursive: !0 }, f_current_lore_settings = await getLorebookSettings();
        if (!_.isEqual(_.merge({}, f_current_lore_settings, u_lore_settings), f_current_lore_settings)) { setLorebookSettings(u_lore_settings); }
        console.log("MagVarUpdate (o): Init function finished.");
    }

    const i = { SINGLE_VARIABLE_UPDATED: "mag_variable_updated", VARIABLE_UPDATE_ENDED: "mag_variable_update_ended", VARIABLE_UPDATE_STARTED: "mag_variable_update_started" };
    eventOn(tavern_events.GENERATION_ENDED, r);
    eventOn(tavern_events.MESSAGE_SENT, o);
    eventOn(tavern_events.GENERATION_STARTED, o);
    window.handleResponseMessage = r;
})();