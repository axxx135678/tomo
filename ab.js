// ==UserScript==
// @name         Magical Variable Updater
// @version      1.3.1-fixed
// @description  Adds _.set support for variable manipulation and a dynamic status bar.
// @author       MagicalAstrogy (Original), Modified by AI Assistant
// @match        *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 辅助函数，保持不变
    function t(t){return t.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/,"$1")}function e(t,e){let a=1,s=!1,n="";for(let r=e;r<t.length;r++){const e=t[r],o=r>0?t[r-1]:"";if('"'!==e&&"'"!==e&&"`"!==e||"\\"===o||(s?e===n&&(s=!1):(s=!0,n=e)),!s)if("("===e)a++;else if(")"===e&&(a--,0===a))return r}return-1}function a(t){const e=[];let a="",s=!1,n="",r=0,o=0;for(let i=0;i<t.length;i++){const l=t[i];'"'!==l&&"'"!==l&&"`"!==l||0!==i&&"\\"===t[i-1]||(s?l===n&&(s=!1):(s=!0,n=l)),"["===l&&r++,"]"===l&&r--,"{"===l&&o++,"}"===l&&o--,","!==l||s||0!==r||0!==o?a+=l:(e.push(a.trim()),a="")}return a.trim()&&e.push(a.trim()),a}function s(t){const e=[];let a="",s=!1,n="";for(let r=0;r<t.length;r++){const o=t[r];'"'!==o&&"'"!==o||0!==r&&"\\"===t[r-1]?"."!==o||s?a+=o:(e.push(a),a=""):s?o===n?s=!1:a+=o:(s=!0,n=o)}return a&&e.push(a),e.join(".")}

    // 核心更新函数 n()，保持 1.3.0-fixed 的版本
    async function n(n,r_obj_with_stat_data){var o_changes_made_by_n_func=!1;await eventEmit(i.VARIABLE_UPDATE_STARTED,r_obj_with_stat_data,o_changes_made_by_n_func);var l_display_data_obj=_.cloneDeep(r_obj_with_stat_data),c_delta_data_obj={},d_parsed_set_commands=function(s){const n=[];let r=0;for(;r<s.length;){const o=s.indexOf("_.set(",r);if(-1===o)break;const i=o+6;let l=e(s,i);if(-1===l){r=i+1;continue}let _=l+1;if(_<s.length&&";"===s[_]){for(_++;_<s.length&&" "===s[_];)_++;let e="";if(_+1<s.length&&"/"===s[_]&&"/"===s[_+1]){const t=s.indexOf("\n",_);-1!==t?(e=s.substring(_+2,t).trim(),_=t):(e=s.substring(_+2).trim(),_=s.length)}const c=s.substring(i,l),d=s.substring(o,_),u=a(c);u.length>=3?n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[2]),reason:e}):2===u.length&&n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[1]),reason:e}),r=_}else r=l+1}return n}(n),u_vars_updated_flag=!1;
        for(const cmd of d_parsed_set_commands){
            var{path:f_path,oldValue:g_old_val_str,newValue:g_new_val_str,reason:h_reason}=cmd;
            f_path=s(f_path);

            if (_.has(r_obj_with_stat_data.stat_data, f_path) || g_old_val_str === 'undefined') {
                if (!_.has(r_obj_with_stat_data.stat_data, f_path)) {
                    console.info(`MagVarUpdate (n): Creating new entry for path: '${f_path}'`);
                }

                const e_val_before = _.get(r_obj_with_stat_data.stat_data, f_path);
                let final_new_value;

                if (_.isString(g_new_val_str)) {
                    const trimmed_g = g_new_val_str.trim();
                    if ((trimmed_g.startsWith('{') && trimmed_g.endsWith('}')) || (trimmed_g.startsWith('[') && trimmed_g.endsWith(']'))) {
                        try {
                            final_new_value = JSON.parse(trimmed_g);
                        } catch (err) {
                            console.error(`MagVarUpdate (n): Failed to parse new value as JSON for path '${f_path}', falling back to string: ${g_new_val_str}. Error: ${err.message}`);
                            final_new_value = t(g_new_val_str);
                        }
                    } else {
                        final_new_value = t(g_new_val_str);
                    }
                } else {
                    final_new_value = g_new_val_str;
                }
                
                _.set(r_obj_with_stat_data.stat_data, f_path, final_new_value);
                
                const new_val_for_display = _.isObject(final_new_value) ? JSON.stringify(final_new_value) : final_new_value;
                const old_val_for_display = _.isObject(e_val_before) ? JSON.stringify(e_val_before) : e_val_before;
                const reason_text = h_reason ? `(${h_reason})` : "";
                const diff_text = `${old_val_for_display}->${new_val_for_display} ${reason_text}`;
                
                _.set(l_display_data_obj.stat_data, f_path, diff_text); // For display_data, record the diff string
                _.set(c_delta_data_obj, f_path, diff_text); // For delta_data, record the diff string
                u_vars_updated_flag = true;
                console.info(`MagVarUpdate (n): Set '${f_path}' to '${new_val_for_display}' ${reason_text}`);
                await eventEmit(i.SINGLE_VARIABLE_UPDATED, r_obj_with_stat_data.stat_data, f_path, e_val_before, final_new_value);
            } else {
                const t_err=`MagVarUpdate (n): Path '${f_path}' was not found and creation was not explicitly requested with 'undefined'. Value: ${g_new_val_str}`;
                console.error(t_err);
            }
        }
        r_obj_with_stat_data.display_data=l_display_data_obj.stat_data; // Set display_data on the main object
        r_obj_with_stat_data.delta_data=c_delta_data_obj;       // Set delta_data on the main object
        await eventEmit(i.VARIABLE_UPDATE_ENDED,r_obj_with_stat_data,o_changes_made_by_n_func);
        return u_vars_updated_flag || o_changes_made_by_n_func; // Return true if any _.set was successful OR original flag was true
    }

    // 生成结束事件处理函数 r()，【已修改】
    async function r(){
        console.log("MagVarUpdate (r): GENERATION_ENDED triggered.");
        const current_msg_id = await getLastMessageId();
        var messages_array = await getChatMessages(current_msg_id);

        if(messages_array.length === 0){
            console.error("MagVarUpdate (r): No message found with ID:", current_msg_id);
            return;
        }
        var current_msg_obj = messages_array[0]; // Assuming array is [message]
        if(current_msg_obj.role !== "assistant"){
            console.log("MagVarUpdate (r): Last message not from assistant. Skipping.");
            return;
        }

        var status_placeholder_added = false;
        var ai_message_content = current_msg_obj.message;
        
        // --- 【修改点 1】获取并确保 i_data 和 i_data.stat_data 的存在 ---
        const base_data_for_current_turn = await async function(prev_msg_id_num){
            for(;!(prev_msg_id_num<0);){
                var prev_msgs_arr=await getChatMessages(prev_msg_id_num);
                if(prev_msgs_arr.length>0 && prev_msgs_arr[0].data){
                    if(_.has(prev_msgs_arr[0].data,"stat_data")) {
                        console.log("MagVarUpdate (r): Found stat_data in previous message ID:", prev_msg_id_num);
                        return prev_msgs_arr[0].data;
                    }
                }
                --prev_msg_id_num;
            }
            console.log("MagVarUpdate (r): No stat_data in previous messages, falling back to getVariables().");
            return await getVariables();
        }(current_msg_id-1);

        let i_data_for_processing;
        if (base_data_for_current_turn && typeof base_data_for_current_turn === 'object') {
            i_data_for_processing = _.cloneDeep(base_data_for_current_turn);
        } else {
            i_data_for_processing = {};
            console.warn("MagVarUpdate (r): Base data from previous turn/getVariables() was not a valid object. Initializing fresh i_data_for_processing.");
        }

        if (!_.has(i_data_for_processing, "stat_data") || typeof i_data_for_processing.stat_data !== 'object' || i_data_for_processing.stat_data === null) {
            i_data_for_processing.stat_data = {}; // ENSURE stat_data is an object
            console.warn("MagVarUpdate (r): i_data_for_processing.stat_data was missing or not an object. Initialized as empty object.");
        }
        // --- 修改点 1 结束 ---

        var variables_were_updated_by_n = false; 
        variables_were_updated_by_n = await n(ai_message_content, i_data_for_processing); // n() modifies i_data_for_processing.stat_data

        if(variables_were_updated_by_n){
             console.log("MagVarUpdate (r): Variables were updated by n(). Running replaceVariables.");
             await replaceVariables(i_data_for_processing); // Uses i_data_for_processing.stat_data
        }

        // --- 【修改点 2】总是保存 i_data_for_processing (包含stat_data)回当前消息 ---
        console.log("MagVarUpdate (r): Saving data to message ID:", current_msg_id, "Data to save:", JSON.parse(JSON.stringify(i_data_for_processing)));
        await setChatMessage({data: i_data_for_processing}, current_msg_id, {refresh:"none"});
        // --- 修改点 2 结束 ---

        // 处理状态栏占位符 (逻辑保持不变)
        if(!ai_message_content.includes("<CharView") && !ai_message_content.includes("<StatusPlaceHolderImpl/>")){
            if(ai_message_content.includes("<StatusPlaceHolder/>")){
                ai_message_content = ai_message_content.replace("<StatusPlaceHolder/>","<StatusPlaceHolderImpl/>");
                status_placeholder_added = true;
            } else {
                ai_message_content += "\n\n"+"<StatusPlaceHolderImpl/>";
                status_placeholder_added = true;
            }
        }
        if(status_placeholder_added){
            console.info("MagVarUpdate (r): Adding/Replacing StatusPlaceHolderImpl in message text.");
            await setChatMessage({message:ai_message_content}, current_msg_id, {refresh:"display_and_render_current"});
        }
        console.log("MagVarUpdate (r): GENERATION_ENDED finished.");
    }

    // 初始化函数 o()，【已修改】确保 s.stat_data 正确初始化并保存
    async function o(){
        console.log("MagVarUpdate (o): MESSAGE_SENT or GENERATION_STARTED triggered.");
        var messages_for_swipe_data_source = [];
        try{ messages_for_swipe_data_source = await getChatMessages(-2,{role:"assistant",include_swipes:true}); } catch(e){} // Silently fail if -2 doesn't exist

        if(!messages_for_swipe_data_source || messages_for_swipe_data_source.length === 0){
            messages_for_swipe_data_source = await getChatMessages(0,{include_swipes:true});
        }
        if(!messages_for_swipe_data_source || messages_for_swipe_data_source.length === 0){
            console.error("MagVarUpdate (o): No messages found to initialize from. Exiting init.");
            return;
        }

        var latest_message_obj = messages_for_swipe_data_source[0];
        var swipe_data_obj = latest_message_obj.swipes_data && latest_message_obj.swipes_data[latest_message_obj.swipe_id];
        
        var selected_global_lorebooks_arr = (await getLorebookSettings()).selected_global_lorebooks || [];
        var current_char_primary_lorebook = await getCurrentCharPrimaryLorebook();
        if(current_char_primary_lorebook !== null && !selected_global_lorebooks_arr.includes(current_char_primary_lorebook)) {
            selected_global_lorebooks_arr.push(current_char_primary_lorebook);
        }

        if(swipe_data_obj === undefined || swipe_data_obj === null || typeof swipe_data_obj !== 'object'){
            swipe_data_obj = {}; // Initialize as empty object if not valid
            console.warn("MagVarUpdate (o): swipe_data_obj was undefined or invalid, initialized as {}.");
        }
        
        // --- 【修改点 3】确保 swipe_data_obj.stat_data 总是对象 ---
        if (!_.has(swipe_data_obj, "stat_data") || typeof swipe_data_obj.stat_data !== 'object' || swipe_data_obj.stat_data === null) {
            swipe_data_obj.stat_data = {};
            console.warn("MagVarUpdate (o): swipe_data_obj.stat_data was missing or not an object. Initialized as {}.");
        }
        if (!_.has(swipe_data_obj, "initialized_lorebooks") || !Array.isArray(swipe_data_obj.initialized_lorebooks)) {
            swipe_data_obj.initialized_lorebooks = [];
            console.warn("MagVarUpdate (o): swipe_data_obj.initialized_lorebooks was missing or not an array. Initialized as [].");
        }
        // --- 修改点 3 结束 ---

        var initvar_was_processed = false;
        for(const lorebook_id of selected_global_lorebooks_arr){
            if(!swipe_data_obj.initialized_lorebooks.includes(lorebook_id)){
                swipe_data_obj.initialized_lorebooks.push(lorebook_id);
                var lorebook_entries_arr = await getLorebookEntries(lorebook_id);
                for(const entry of lorebook_entries_arr){
                    if(entry.comment?.toLowerCase().includes("[initvar]")){
                        try{
                            const parsed_initvar_json = JSON.parse(substitudeMacros(entry.content));
                            swipe_data_obj.stat_data = _.merge({}, swipe_data_obj.stat_data, parsed_initvar_json); // Ensure merge into object
                            initvar_was_processed = true;
                            console.log("MagVarUpdate (o): Processed [initvar] from lorebook:", lorebook_id, "Entry:", entry.name || entry.uid);
                        }catch(err){
                            console.error(`MagVarUpdate (o): Failed to parse JSON from [initvar] lorebook entry: ${err.message}`, entry);
                            toastr.error(err.message,"Failed to parse [initvar] JSON",{timeOut:7000});
                        }
                    }
                }
            }
        }

        // --- 【修改点 4】总是尝试保存初始化的 swipe_data_obj (包含stat_data) ---
        // if(!initvar_was_processed && !Object.keys(swipe_data_obj.stat_data).length) {
        // This old condition was: if nothing was processed AND stat_data is still empty, then return.
        // New logic: Always proceed to save, because even an empty stat_data needs to be established.
        // }
        console.info("MagVarUpdate (o): Saving initial variables (stat_data etc.) globally via insertOrAssignVariables.", JSON.parse(JSON.stringify(swipe_data_obj)));
        await insertOrAssignVariables(swipe_data_obj); // This makes swipe_data_obj (including .stat_data) available via getVariables()
        // --- 修改点 4 结束 ---

        // 为所有swipe应用更新 (这个逻辑比较复杂，暂时保持，但关注点是上面的初始化)
        console.log("MagVarUpdate (o): Processing swipes for message ID:", latest_message_obj.message_id);
        for(var swipe_idx=0; swipe_idx < latest_message_obj.swipes.length; swipe_idx++){
            var cloned_data_for_swipe = _.cloneDeep(swipe_data_obj); // Start with the initialized (or loaded) data
            await n(substitudeMacros(latest_message_obj.swipes[swipe_idx]), cloned_data_for_swipe); // n() updates cloned_data_for_swipe.stat_data
            console.log(`MagVarUpdate (o): Saving data for swipe ${swipe_idx} of message ID ${latest_message_obj.message_id}.`, JSON.parse(JSON.stringify(cloned_data_for_swipe)));
            await setChatMessage({data:cloned_data_for_swipe}, latest_message_obj.message_id, {refresh:"none", swipe_id:swipe_idx});
        }
        
        // Lorebook settings (保持不变)
        const u_lore_settings={context_percentage:100,recursive:!0},f_current_lore_settings=await getLorebookSettings();
        if(!_.isEqual(_.merge({},f_current_lore_settings,u_lore_settings),f_current_lore_settings)){
            setLorebookSettings(u_lore_settings);
        }
        console.log("MagVarUpdate (o): Init function finished.");
    }

    const i={SINGLE_VARIABLE_UPDATED:"mag_variable_updated",VARIABLE_UPDATE_ENDED:"mag_variable_update_ended",VARIABLE_UPDATE_STARTED:"mag_variable_update_started"};
    eventOn(tavern_events.GENERATION_ENDED,r);
    eventOn(tavern_events.MESSAGE_SENT,o);
    eventOn(tavern_events.GENERATION_STARTED,o);
    window.handleResponseMessage=r;
})();