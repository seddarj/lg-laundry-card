// card-tools for more-info. MIT license (This isn't a substantial portion)
function lovelace_view() {
  var root = document.querySelector("hc-main");
  if(root) {
    root = root && root.shadowRoot;
    root = root && root.querySelector("hc-lovelace");
    root = root && root.shadowRoot;
    root = root && root.querySelector("hui-view") || root.querySelector("hui-panel-view");
    return root;
  }
  root = document.querySelector("home-assistant");
  root = root && root.shadowRoot;
  root = root && root.querySelector("home-assistant-main");
  root = root && root.shadowRoot;
  root = root && root.querySelector("app-drawer-layout partial-panel-resolver");
  root = root && root.shadowRoot || root;
  root = root && root.querySelector("ha-panel-lovelace");
  root = root && root.shadowRoot;
  root = root && root.querySelector("hui-root");
  root = root && root.shadowRoot;
  root = root && root.querySelector("ha-app-layout #view");
  root = root && root.firstElementChild;
  return root;
}
function fireEvent(ev, detail, entity=null) {
  ev = new Event(ev, {
    bubbles: true,
    cancelable: false,
    composed: true,
  });
  ev.detail = detail || {};
  if(entity) {
    entity.dispatchEvent(ev);
  } else {
    var root = lovelace_view();
    if (root) root.dispatchEvent(ev);
  }
}
function moreInfo(entity, large=false) {
  const root = document.querySelector("hc-main") || document.querySelector("home-assistant");
  fireEvent("hass-more-info", {entityId: entity}, root);
  const el = root._moreInfoEl;
  el.large = large;
  return el;
}
class LgLaundryCard extends HTMLElement {
  set hass(hass) {
    const entityId = this.config.entity;
    const state = hass.states[entityId];
    if (!state) {
        throw new Error('Entity not found. Maybe check to make sure it exists.');
    }
    const stateStr = state ? state.state : 'unavailable';
    const friendlyName = state.attributes.friendly_name;
    const friendlyNameStr = friendlyName ? " " + friendlyName : "";
    const courseName = state.attributes.current_course;
    const courseNameStr = courseName ? " " + courseName : "an unknown cycle";
    const stageName = state.attributes.run_state;
    const stageNameStr = stageName ? " " + stageName : "unknown";
    const iconName = state.attributes.icon;
    const iconNameStr = iconName ? iconName : "";
    const remainTime = state.attributes.remain_time;
    const remainTimeStr = remainTime ? remainTime : "unknown";
    const totalTime = state.attributes.initial_time;
    const totalTimeStr = totalTime ? totalTime : "unknown";
    var worked;
    var percentDone;
    try {
        const minRemain = (parseInt(remainTimeStr.split(":")[0]) * 60) + parseInt(remainTimeStr.split(":")[1]);
        const minTotal = (parseInt(totalTimeStr.split(":")[0]) * 60) + parseInt(totalTimeStr.split(":")[1]);
        percentDone = String(Math.round((minTotal - minRemain) / minTotal * 100)) + "%";
        worked = !isNaN(Math.round((minTotal - minRemain) / minTotal * 100));
    } catch(err) {
        console.log(err);
        worked = false;
    }
    if (!this.content) {
      this.contenta = document.createElement('a');
      this.contenta.href = "#";
      this.contenta.style.textDecoration = "unset";
      this.contenta.style.color = "unset";
      function laundryinfo() {
          window.history.pushState({}, "", window.location.href.split("#")[0]);
          moreInfo(this.entityId);
      }
      this.contenta.onclick = laundryinfo.bind({entityId: entityId});
      this.content = document.createElement('div');
      this.content.style.padding = '0 16px 16px';
      this.content.style.display = 'flex';
      const card = document.createElement('ha-card');
      card.header = friendlyNameStr;
      this.contenta.appendChild(card);
      card.appendChild(this.content);
      this.appendChild(this.contenta);
    }
    var conthtml = '';
    conthtml = `
      <ha-icon icon="${iconNameStr}" style="transform: scale(3,3); color: ${stateStr == 'on' ? "var(--sidebar-selected-icon-color)" : "var(--secondary-text-color)"}; display: block; padding: 8px 9px 12px 5px; margin: 15px;"></ha-icon>
      <div>${friendlyNameStr} is currently ${stateStr}.
    `;
    if (stateStr == 'on') {
        conthtml += `
          <br/>The ${courseNameStr} progress is ${stageNameStr}.
          <br/>There's ${remainTimeStr} remaining out of ${totalTimeStr} total.
        `;
        if (worked) {
          conthtml += `
            <br/>
            <div style="width: 100%; height: 30px; background-color: #8f89; display: inline-block;">
              <div style="max-width: 0; min-width: 0; max-width: ${percentDone} !important; min-width: ${percentDone} !important; height: 30px; background-color: #09d9; display: inline-block;">
                <b style="line-height: 30px; margin: 0 10px; display: block;">${percentDone}</b>
              </div>
            </div>
            </div>
          `;
          conthtml = conthtml.replace("8px 9px 12px 5px", "16px 9px 12px 5px");
        } else {
            conthtml += "</div>";
        }
    } else {
        conthtml += "</div>";
    }
    this.content.innerHTML = conthtml;
  }
  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define a laundry entity');
    }
    this.config = config;
  }
  getCardSize() {
    return 3;
  }
  static getStubConfig() {
    return { entity: "sensor.my_washing_machine" };
  }
}

customElements.define('lg-laundry-card', LgLaundryCard);
window.customCards.push({type: "lg-laundry-card", name: "LG laundry card", description: "Card for LG laundry machines."});

