// ==UserScript==
// @name         Magical Variable Updater
// @version      1.3.0-fixed
// @description  Adds _.set support for variable manipulation and a dynamic status bar.
// @author       MagicalAstrogy (Original), Modified by AI Assistant
// @match        *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 辅助函数，保持不变
    function t(t){return t.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/,"$1")}function e(t,e){let a=1,s=!1,n="";for(let r=e;r<t.length;r++){const e=t[r],o=r>0?t[r-1]:"";if('"'!==e&&"'"!==e&&"`"!==e||"\\"===o||(s?e===n&&(s=!1):(s=!0,n=e)),!s)if("("===e)a++;else if(")"===e&&(a--,0===a))return r}return-1}function a(t){const e=[];let a="",s=!1,n="",r=0,o=0;for(let i=0;i<t.length;i++){const l=t[i];'"'!==l&&"'"!==l&&"`"!==l||0!==i&&"\\"===t[i-1]||(s?l===n&&(s=!1):(s=!0,n=l)),"["===l&&r++,"]"===l&&r--,"{"===l&&o++,"}"===l&&o--,","!==l||s||0!==r||0!==o?a+=l:(e.push(a.trim()),a="")}return a.trim()&&e.push(a.trim()),a}function s(t){const e=[];let a="",s=!1,n="";for(let r=0;r<t.length;r++){const o=t[r];'"'!==o&&"'"!==o||0!==r&&"\\"===t[r-1]?"."!==o||s?a+=o:(e.push(a),a=""):s?o===n?s=!1:a+=o:(s=!0,n=o)}return a&&e.push(a),e.join(".")}

    // 核心更新函数 n()，已修改
    async function n(n,r){var o=!1;await eventEmit(i.VARIABLE_UPDATE_STARTED,r,o);var l=_.cloneDeep(r),c={},d=function(s){const n=[];let r=0;for(;r<s.length;){const o=s.indexOf("_.set(",r);if(-1===o)break;const i=o+6;let l=e(s,i);if(-1===l){r=i+1;continue}let _=l+1;if(_<s.length&&";"===s[_]){for(_++;_<s.length&&" "===s[_];)_++;let e="";if(_+1<s.length&&"/"===s[_]&&"/"===s[_+1]){const t=s.indexOf("\n",_);-1!==t?(e=s.substring(_+2,t).trim(),_=t):(e=s.substring(_+2).trim(),_=s.length)}const c=s.substring(i,l),d=s.substring(o,_),u=a(c);u.length>=3?n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[2]),reason:e}):2===u.length&&n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[1]),reason:e}),r=_}else r=l+1}return n}(n),u=!1;
        for(const e of d){
            var{path:f,oldValue:g_old,newValue:g,reason:h}=e;
            f=s(f);

            if (_.has(r.stat_data, f) || g_old === 'undefined') {
                if (!_.has(r.stat_data, f)) {
                    console.info(`Creating new entry for path: '${f}'`);
                }

                const e_val_before = _.get(r.stat_data, f);

                // 【修改点1.1】更智能的新值解析逻辑
                let final_new_value;
                if (_.isString(g)) {
                    const trimmed_g = g.trim();
                    if ((trimmed_g.startsWith('{') && trimmed_g.endsWith('}')) || (trimmed_g.startsWith('[') && trimmed_g.endsWith(']'))) {
                        try {
                            final_new_value = JSON.parse(trimmed_g);
                        } catch (err) {
                            console.error(`Failed to parse new value as JSON for path '${f}', falling back to string: ${g}`);
                            final_new_value = t(g); // 解析失败，则作为普通字符串处理
                        }
                    } else {
                        final_new_value = t(g); // 不是JSON格式，作为普通字符串处理
                    }
                } else {
                    final_new_value = g; // 如果 g 本来就不是字符串，直接使用
                }
                
                // 设置最终值
                _.set(r.stat_data, f, final_new_value);
                
                // 更新 display_data 和 delta_data 用于日志和显示
                const new_val_for_display = _.isObject(final_new_value) ? JSON.stringify(final_new_value) : final_new_value;
                const old_val_for_display = _.isObject(e_val_before) ? JSON.stringify(e_val_before) : e_val_before;
                const reason_text = h ? `(${h})` : "";
                const diff_text = `${old_val_for_display}->${new_val_for_display} ${reason_text}`;
                
                _.set(l.stat_data, f, diff_text);
                _.set(c, f, diff_text);
                u = true;
                console.info(`Set '${f}' to '${new_val_for_display}' ${reason_text}`);
                await eventEmit(i.SINGLE_VARIABLE_UPDATED, r.stat_data, f, e_val_before, final_new_value);
            } else {
                const t_err=`undefined Path: '${f}' was not found and creation was not explicitly requested with 'undefined'.`;
                console.error(t_err);
            }
        }
        return r.display_data=l.stat_data,r.delta_data=c,await eventEmit(i.VARIABLE_UPDATE_ENDED,r,o),u||o
    }

    // 生成结束事件处理函数 r()，保持上次修复后的状态
    async function r(){const t=await getLastMessageId();var e=await getChatMessages(t);if(e.length>0){var a=e[e.length-1];if("assistant"!=a.role)return;var s=!1,r_msg=a.message;const i_data=await async function(t){for(;!(t<0);){var e=await getChatMessages(t);if(e.length>0){var a=e[0].data;if(_.has(a,"stat_data"))return a}--t}return await getVariables()}(t-1);if(!_.has(i_data,"stat_data"))return void console.error("cannot found stat_data.");var o=!1;
        o=o||await n(r_msg,i_data); // 调用更新
        if(o){ await replaceVariables(i_data); } // 如果有变量被更新，则替换文本中的变量
        await setChatMessage({data:i_data},t,{refresh:"none"}); // 总是保存数据

        if(!r_msg.includes("<CharView")&&!r_msg.includes("<StatusPlaceHolderImpl/>")){
            if(r_msg.includes("<StatusPlaceHolder/>")){
                const t_placeholder="<StatusPlaceHolderImpl/>";
                r_msg=r_msg.replace("<StatusPlaceHolder/>",t_placeholder),s=!0
            }else{
                r_msg+="\n\n"+"<StatusPlaceHolderImpl/>",s=!0
            }
        }
        if(s){
            console.info("Adding/Replacing StatusPlaceHolder...");
            await setChatMessage({message:r_msg},t,{refresh:"display_and_render_current"})
        }
    }}

    // 初始化等其他函数，保持不变
    async function o(){var t=[];try{await getChatMessages(-2,{role:"assistant",include_swipes:!0})}catch(t){}if(t||(t=[]),t.length<=0){var e=await getChatMessages(0,{include_swipes:!0});if(!(e&&e.length>0))return void console.error("不存在任何一条消息，退出");t=e}var a=t[0],s=a.swipes_data[a.swipe_id],r=(await getLorebookSettings()).selected_global_lorebooks,o=await getCurrentCharPrimaryLorebook();null!==o&&r.push(o),void 0===s&&(s={display_data:{},initialized_lorebooks:[],stat_data:{},delta_data:{}}),_.has(s,"initialized_lorebooks")||(s.initialized_lorebooks=[]),s.stat_data||(s.stat_data={});var i=!1;for(const t of r)if(!s.initialized_lorebooks.includes(t)){s.initialized_lorebooks.push(t);var l=await getLorebookEntries(t);for(const t of l)if(t.comment?.toLowerCase().includes("[initvar]"))try{const e=JSON.parse(substitudeMacros(t.content));s.stat_data=_.merge(s.stat_data,e)}catch(t){return console.error(`Failed to parse JSON from lorebook entry: ${t}`),void toastr.error(t.message,"Failed to parse JSON from lorebook entry",{timeOut:5e3})}i=!0}if(!i)return;console.info("Init chat variables."),await insertOrAssignVariables(s);for(var c=0;c<a.swipes.length;c++){var d=_.cloneDeep(s);await n(substitudeMacros(a.swipes[c]),d),await setChatMessage({data:d},a.message_id,{refresh:"none",swipe_id:c})}const u={context_percentage:100,recursive:!0},f=await getLorebookSettings();_.isEqual(_.merge({},f,u),f)&&setLorebookSettings(u)}
    const i={SINGLE_VARIABLE_UPDATED:"mag_variable_updated",VARIABLE_UPDATE_ENDED:"mag_variable_update_ended",VARIABLE_UPDATE_STARTED:"mag_variable_update_started"};
    eventOn(tavern_events.GENERATION_ENDED,r);
    eventOn(tavern_events.MESSAGE_SENT,o);
    eventOn(tavern_events.GENERATION_STARTED,o);
    window.handleResponseMessage=r;
})();