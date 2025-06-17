function t(t){return t.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/,"$1")}function e(t,e){let a=1,s=!1,n="";for(let r=e;r<t.length;r++){const e=t[r],o=r>0?t[r-1]:"";if('"'!==e&&"'"!==e&&"`"!==e||"\\"===o||(s?e===n&&(s=!1):(s=!0,n=e)),!s)if("("===e)a++;else if(")"===e&&(a--,0===a))return r}return-1}function a(t){const e=[];let a="",s=!1,n="",r=0,o=0;for(let i=0;i<t.length;i++){const l=t[i];'"'!==l&&"'"!==l&&"`"!==l||0!==i&&"\\"===t[i-1]||(s?l===n&&(s=!1):(s=!0,n=l)),"["===l&&r++,"]"===l&&r--,"{"===l&&o++,"}"===l&&o--,","!==l||s||0!==r||0!==o?a+=l:(e.push(a.trim()),a="")}return a.trim()&&e.push(a.trim()),e}function s(t){const e=[];let a="",s=!1,n="";for(let r=0;r<t.length;r++){const o=t[r];'"'!==o&&"'"!==o||0!==r&&"\\"===t[r-1]?"."!==o||s?a+=o:(e.push(a),a=""):s?o===n?s=!1:a+=o:(s=!0,n=o)}return a&&e.push(a),s.join(".")}async function n(n,r){var o=!1;await eventEmit(i.VARIABLE_UPDATE_STARTED,r,o);var l=_.cloneDeep(r),c={},d=function(s){const n=[];let r=0;for(;r<s.length;){const o=s.indexOf("_.set(",r);if(-1===o)break;const i=o+6;let l=e(s,i);if(-1===l){r=i+1;continue}let _=l+1;if(_<s.length&&";"===s[_]){for(_++;_<s.length&&" "===s[_];)_++;let e="";if(_+1<s.length&&"/"===s[_]&&"/"===s[_+1]){const t=s.indexOf("\n",_);-1!==t?(e=s.substring(_+2,t).trim(),_=t):(e=s.substring(_+2).trim(),_=s.length)}const c=s.substring(i,l),d=s.substring(o,_),u=a(c);u.length>=3?n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[2]),reason:e}):2===u.length&&n.push({fullMatch:d,path:t(u[0]),oldValue:t(u[1]),newValue:t(u[1]),reason:e}),r=_}else r=l+1}return n}(n),u=!1;for(const e of d){var{path:f,oldValue: K,newValue:g,reason:h}=e; // K will be parsed_oldValue_str
if(f=s(f),_.has(r.stat_data,f)){const e=_.get(r.stat_data,f);if(_.isString(g)&&g.trim().startsWith("[")&&g.trim().endsWith("]"))try{const t=JSON.parse(g);Array.isArray(t)&&t.length>0&&(g=t[0])}catch(t){console.error(`Error parsing JSON array for '${f}': ${t.message}`)}if("number"==typeof e){const t=Number(g),a=e;_.set(r.stat_data,f,t);const s=h?`(${h})`:"",n=`${a}->${t} ${s}`;_.set(l.stat_data,f,n),_.set(c,f,n),u=!0,console.info(`Set '${f}' to '${t}' ${s}`),await eventEmit(i.SINGLE_VARIABLE_UPDATED,r.stat_data,f,a,t)}else if(Array.isArray(e)&&2===e.length){const a="number"==typeof e[0]?Number(g):t(g),s=_.cloneDeep(e[0]);e[0]=a,_.set(r.stat_data,f,e);const n=h?`(${h})`:"",o=`${s}->${g} ${n}`;_.set(l.stat_data,f,o),_.set(c,f,o),u=!0,console.info(`Set '${f}' to '${a}' ${n}`),await eventEmit(i.SINGLE_VARIABLE_UPDATED,r.stat_data,f,s,a)}else{const a=t(g),s=_.cloneDeep(e);_.set(r.stat_data,f,a);const n=h?`(${h})`:"",o=`${s}->${a} ${n}`;_.set(l.stat_data,f,o),_.set(c,f,o),u=!0,console.info(`Set '${f}' to '${a}' ${n}`),await eventEmit(i.SINGLE_VARIABLE_UPDATED,r.stat_data,f,s,a)}}
// ===== MODIFICATION START =====
// Old 'else' block for non-existent path is replaced by this 'else if / else' structure
else if (K === 'undefined') { // K is the parsed_oldValue_str from the command
    console.info(`Path '${f}' does not exist, and oldValue from command is 'undefined'. Attempting to create.`);
    let actual_new_value_for_setting; // Variable to hold the parsed new value
    const trimmed_g = g.trim(); // g is the newValue string from the command

    if (trimmed_g.startsWith("[") && trimmed_g.endsWith("]")) {
        try {
            actual_new_value_for_setting = JSON.parse(trimmed_g);
        } catch (jsonError) {
            console.warn(`Failed to parse '${trimmed_g}' as JSON array for new path '${f}'. Treating as string. Error: ${jsonError.message}`);
            actual_new_value_for_setting = t(g); // t() is the global quote stripper function
        }
    } else {
        const numVal = Number(trimmed_g);
        // Check if it's a valid number and not an empty string that Number() might parse as 0
        if (!isNaN(numVal) && trimmed_g !== '') {
            actual_new_value_for_setting = numVal;
        } else {
            actual_new_value_for_setting = t(g); // t() is the global quote stripper function
        }
    }

    _.set(r.stat_data, f, actual_new_value_for_setting); // Set in the live stat_data (r.stat_data)

    const reason_str = h ? `(${h})` : ""; // h is the reason string from command
    const display_change_str = `undefined->${g} ${reason_str}`; // g is original newValue string for display

    _.set(l.stat_data, f, display_change_str); // Update display data store (l.stat_data)
    _.set(c, f, display_change_str); // Update delta data store (c)

    u = true; // Set dirty flag
    console.info(`CREATED and Set '${f}' to (internal value: ${JSON.stringify(actual_new_value_for_setting)}, from string: '${g}') ${reason_str}`);
    await eventEmit(i.SINGLE_VARIABLE_UPDATED, r.stat_data, f, undefined, actual_new_value_for_setting); // Emit event with actual undefined as oldValue
}
else{const t_error_msg=`undefined Path: ${f}->${g} (${h}) and oldValue was '${K}'. Cannot create.`;console.error(t_error_msg)} // K is parsed_oldValue_str
// ===== MODIFICATION END =====
}return r.display_data=l.stat_data,r.delta_data=c,await eventEmit(i.VARIABLE_UPDATE_ENDED,r,o),u||o}async function r(){const t=await getLastMessageId();var e=await getChatMessages(t);if(e.length>0){var a=e[e.length-1];if("assistant"!=a.role)return;var s=!1,r=a.message;const i=await async function(t){for(;!(t<0);){var e=await getChatMessages(t);if(e.length>0){var a=e[0].data;if(_.has(a,"stat_data"))return a}--t}return await getVariables()}(t-1);if(!_.has(i,"stat_data"))return void console.error("cannot found stat_data.");var o=!1;if((o=o||await n(r,i))&&await replaceVariables(i),await setChatMessage({data:i},t,{refresh:"none"}),!r.includes("<CharView")&&!r.includes("<StatusPlaceHolderImpl/>"))if(r.includes("<StatusPlaceHolder/>")){const t="<StatusPlaceHolderImpl/>";r=r.replace("<StatusPlaceHolder/>",t),s=!0}else{r+="\n\n"+"<StatusPlaceHolderImpl/>",s=!0}s&&(console.info("Replace content...."),await setChatMessage({message:r},t,{refresh:"display_and_render_current"}))}}async function o(){var t=[];try{await getChatMessages(-2,{role:"assistant",include_swipes:!0})}catch(t){}if(t||(t=[]),t.length<=0){var e=await getChatMessages(0,{include_swipes:!0});if(!(e&&e.length>0))return void console.error("不存在任何一条消息，退出");t=e}var a=t[0],s=a.swipes_data[a.swipe_id],r=(await getLorebookSettings()).selected_global_lorebooks,o=await getCurrentCharPrimaryLorebook();null!==o&&r.push(o),void 0===s&&(s={display_data:{},initialized_lorebooks:[],stat_data:{},delta_data:{}}),_.has(s,"initialized_lorebooks")||(s.initialized_lorebooks=[]),s.stat_data||(s.stat_data={});var i=!1;for(const t of r)if(!s.initialized_lorebooks.includes(t)){s.initialized_lorebooks.push(t);var l=await getLorebookEntries(t);for(const t of l)if(t.comment?.toLowerCase().includes("[initvar]"))try{const e=JSON.parse(substitudeMacros(t.content));s.stat_data=_.merge(s.stat_data,e)}catch(t){return console.error(`Failed to parse JSON from lorebook entry: ${t}`),void toastr.error(t.message,"Failed to parse JSON from lorebook entry",{timeOut:5e3})}i=!0}if(!i)return;console.info("Init chat variables."),await insertOrAssignVariables(s);for(var c=0;c<a.swipes.length;c++){var d=_.cloneDeep(s);await n(substitudeMacros(a.swipes[c]),d),await setChatMessage({data:d},a.message_id,{refresh:"none",swipe_id:c})}const u={context_percentage:100,recursive:!0},f=await getLorebookSettings();_.isEqual(_.merge({},f,u),f)&&setLorebookSettings(u)}eventOn(tavern_events.GENERATION_ENDED,r),eventOn(tavern_events.MESSAGE_SENT,o),eventOn(tavern_events.GENERATION_STARTED,o);const i={SINGLE_VARIABLE_UPDATED:"mag_variable_updated",VARIABLE_UPDATE_ENDED:"mag_variable_update_ended",VARIABLE_UPDATE_STARTED:"mag_variable_update_started"};window.handleResponseMessage=r;export{i as variable_events};
//# sourceMappingURL=bundle.js.map
