// ==UserScript==
// @name         Magical Variable Updater (DEBUGGING VERSION)
// @version      1.3.4-debug
// @description  Adds _.set support for variable manipulation and a dynamic status bar.
// @author       MagicalAstrogy (Original), Modified by AI Assistant for Debugging
// @match        *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("MagVarUpdate Script: STARTING EXECUTION (v1.3.4-debug)"); // 【调试点 1】确认脚本开始

    // 保持辅助函数，以防万一后续测试需要
    function t(str) { if (typeof str !== 'string') return str; return str.replace(/^[\s"'`]*(.*?)[\s"'`]*$/, "$1"); }
    function e(str, startIndex) { let a = 1, s = !1, n = ""; for (let r = startIndex; r < str.length; r++) { const e_char = str[r], o = r > 0 ? str[r - 1] : ""; if ('"' !== e_char && "'" !== e_char && "`" !== e_char || "\\" === o || (s ? e_char === n && (s = !1) : (s = !0, n = e_char)), !s) if ("(" === e_char) a++; else if (")" === e_char && (a--, 0 === a)) return r } return -1 }
    function a(str) { const e_arr = []; let a_curr = "", s_in_quote = !1, n_quote_char = "", r_bracket_depth = 0, o_brace_depth = 0; for (let i = 0; i < str.length; i++) { const l_char = str[i]; if ('"' !== l_char && "'" !== l_char && "`" !== l_char || 0 !== i && "\\" === str[i - 1] || (s_in_quote ? l_char === n_quote_char && (s_in_quote = !1) : (s_in_quote = !0, n_quote_char = l_char)), "[" === l_char && r_bracket_depth++, "]" === l_char && r_bracket_depth--, "{" === l_char && o_brace_depth++, "}" === l_char && o_brace_depth--, "," !== l_char || s_in_quote || 0 !== r_bracket_depth || 0 !== o_brace_depth ? a_curr += l_char : (e_arr.push(a_curr.trim()), a_curr = "")) } a_curr.trim() && e_arr.push(a_curr.trim()); return e_arr }
    function s(pathStr) { if (typeof pathStr !== 'string') return ''; const e_parts = []; let a_curr = "", s_in_quote = !1, n_quote_char = ""; for (let r = 0; r < pathStr.length; r++) { const o_char = pathStr[r]; if ('"' !== o_char && "'" !== o_char || 0 !== r && "\\" === pathStr[r - 1] ? "." !== o_char || s_in_quote ? a_curr += o_char : (e_parts.push(a_curr), a_curr = "") : s_in_quote ? o_char === n_quote_char ? s_in_quote = !1 : a_curr += o_char : (s_in_quote = !0, n_quote_char = o_char), '"' === o_char && s_in_quote && pathStr[r-1] !== '\\') { /* ... */ } } a_curr && e_parts.push(a_curr); return e_parts.join(".") }

    // 核心更新函数 n() - 暂时保留，但不被 r() 调用
    async function n_original(ai_reply_content, data_obj_to_update) {
        console.log("MagVarUpdate (n_original): Called, but currently bypassed in debug version's r().");
        return false; // 返回false表示没有变量更新
    }

    // 【调试点 2】极度简化的 r() 函数
    async function r_debug() {
        console.log("MagVarUpdate (r_debug): GENERATION_ENDED triggered. Attempting to add placeholder.");
        let current_msg_id;
        try {
            current_msg_id = await getLastMessageId();
            console.log("MagVarUpdate (r_debug): Got last message ID:", current_msg_id);
        } catch (err) {
            console.error("MagVarUpdate (r_debug): Error in getLastMessageId():", err);
            return; 
        }

        let messages_array;
        try {
            messages_array = await getChatMessages(current_msg_id);
            console.log("MagVarUpdate (r_debug): Got messages array structure:", messages_array ? `Length ${messages_array.length}` : 'null/undefined');
        } catch (err) {
            console.error("MagVarUpdate (r_debug): Error in getChatMessages():", err);
            return;
        }

        if (!messages_array || messages_array.length === 0) {
            console.error("MagVarUpdate (r_debug): No message found for ID:", current_msg_id);
            return;
        }
        
        var current_msg_obj = messages_array[0]; // SillyTavern usually returns [messageObject]
        if (!current_msg_obj || typeof current_msg_obj !== 'object') {
            console.error("MagVarUpdate (r_debug): current_msg_obj is not a valid object for ID:", current_msg_id);
            return;
        }

        if (current_msg_obj.role !== "assistant") {
            console.log("MagVarUpdate (r_debug): Message not from assistant. Role:", current_msg_obj.role);
            return;
        }

        var ai_message_content = current_msg_obj.message;
        if (typeof ai_message_content !== 'string') {
            console.warn("MagVarUpdate (r_debug): ai_message_content is not a string, type:", typeof ai_message_content, "Value:", ai_message_content, ". Using empty string as fallback.");
            ai_message_content = ""; // Fallback
        }
        
        var status_placeholder_added = false;

        console.log("MagVarUpdate (r_debug): Original message content (first 50 chars):", ai_message_content.substring(0, 50));
        console.log("MagVarUpdate (r_debug): Checking for <CharView>:", ai_message_content.includes("<CharView"));
        console.log("MagVarUpdate (r_debug): Checking for <StatusPlaceHolderImpl/>:", ai_message_content.includes("<StatusPlaceHolderImpl/>"));

        if (!ai_message_content.includes("<CharView") && !ai_message_content.includes("<StatusPlaceHolderImpl/>")) {
            if (ai_message_content.includes("<StatusPlaceHolder/>")) {
                console.log("MagVarUpdate (r_debug): Found <StatusPlaceHolder/>, replacing.");
                ai_message_content = ai_message_content.replace("<StatusPlaceHolder/>", "<StatusPlaceHolderImpl/>");
                status_placeholder_added = true;
            } else {
                console.log("MagVarUpdate (r_debug): No placeholder found, appending <StatusPlaceHolderImpl/>.");
                ai_message_content += "\n\n" + "<StatusPlaceHolderImpl/>";
                status_placeholder_added = true;
            }
        } else {
            console.log("MagVarUpdate (r_debug): Placeholder not added because CharView or Impl already present, or content type issue.");
        }

        if (status_placeholder_added) {
            console.info("MagVarUpdate (r_debug): Attempting to setChatMessage with new message content.");
            try {
                await setChatMessage({ message: ai_message_content }, current_msg_id, { refresh: "display_and_render_current" });
                console.info("MagVarUpdate (r_debug): setChatMessage for message content update successful.");
            } catch (err) {
                console.error("MagVarUpdate (r_debug): Error in setChatMessage (message update):", err);
            }
        } else {
            console.log("MagVarUpdate (r_debug): No placeholder was added, skipping message update.");
        }
        console.log("MagVarUpdate (r_debug): GENERATION_ENDED finished.");
    }

    // 初始化函数 o() - 暂时保留，但不附加事件监听
    async function o_original() {
        console.log("MagVarUpdate (o_original): Called, but currently bypassed in debug version.");
    }

    // const i = { SINGLE_VARIABLE_UPDATED: "mag_variable_updated", VARIABLE_UPDATE_ENDED: "mag_variable_update_ended", VARIABLE_UPDATE_STARTED: "mag_variable_update_started" };
    
    // 【调试点 3】附加事件监听
    try {
        console.log("MagVarUpdate Script: Attempting to attach event listeners.");
        if (typeof tavern_events !== 'undefined' && typeof eventOn !== 'undefined') {
            eventOn(tavern_events.GENERATION_ENDED, r_debug);
            // eventOn(tavern_events.MESSAGE_SENT, o_original); // 暂时禁用 o()
            // eventOn(tavern_events.GENERATION_STARTED, o_original); // 暂时禁用 o()
            console.log("MagVarUpdate Script: Event listeners ATTACHED (or attempted).");
        } else {
            console.error("MagVarUpdate Script: tavern_events or eventOn is UNDEFINED. Cannot attach listeners.");
        }
    } catch (err) {
        console.error("MagVarUpdate Script: CRITICAL ERROR during event listener attachment:", err);
    }
    
    // window.handleResponseMessage = r_debug; // 保持这个，以防SillyTavern通过它调用

    console.log("MagVarUpdate Script: FINISHED EXECUTION (v1.3.4-debug)"); // 【调试点 4】确认脚本执行完毕
})();