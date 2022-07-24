<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from '../components/SoftwareKey.svelte';
  import TextInputField from '../components/TextInputField.svelte';
  import ChatListView from './ChatListView.svelte';

  const navClass: string = 'optionMenuNav';

  export let title: string = 'Option Menu';
  export let focusIndex: number = 0;
  export let options: Array<any>;
  export let thumbs: { [key: string]: string; } = {};
  export let softKeyLeftText: string = '';
  export let softKeyCenterText: string = 'Close';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, scope) => {};
  export let onBackspace: Function = (evt, scope) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (scope) => {};

  let softwareKey: SoftwareKey;

  export function setTitleText(text) {
    title = text;
  }

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (document.activeElement.tagName !== 'INPUT') {
        setTimeout(() => {
          navInstance.navigateListNav(-navInstance.verticalNavIndex);
        }, 200);
      }
    },
    softkeyRightListener: function(evt) {
      if (document.activeElement.tagName === 'INPUT') {
        console.log('Searching, then');
        navInstance.navigateListNav(1);
      }
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      onEnter(evt, {index: this.verticalNavIndex, selected: options[this.verticalNavIndex]});
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, {index: this.verticalNavIndex, selected: options[this.verticalNavIndex]});
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function getThumb(chat) {
    if (thumbs[chat.iconRef]) {
      return `<img alt="icon" style="background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${thumbs[chat.iconRef]}"/>`;
    }
    return `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${chat.name.split(' ').map(text => text[0]).splice(0, 2).join('')}</div>`;
  }

  function onInput(evt) {}

  function onFocus(evt) {
    if (softwareKey != null) {
      softwareKey.setText({
          left: '',
          center: '',
          right: 'Submit',
        });
    }
  }

  function onBlur(evt) {
    if (softwareKey != null && typeof softwareKey.setText == 'function') {
      softwareKey.setText({
        left: softKeyLeftText,
        center: softKeyCenterText,
        right: softKeyRightText,
      });
    }
  }

  onMount(() => {
    navInstance.attachListener(focusIndex + 1);
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: softKeyLeftText,
        centerText: softKeyCenterText,
        rightText: softKeyRightText
      }
    });
    onOpened();
    setTimeout(() => {
      navInstance.navigateListNav(1);
    }, 500);
  })

  onDestroy(() => {
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed({index: navInstance.verticalNavIndex, selected: options[navInstance.verticalNavIndex]});
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="kai-option-menu">
  <div class="kai-option-menu-content">
    <div class="kai-option-menu-header">{title}</div>
    <div class="kai-option-menu-body" data-pad-top="66" data-pad-bottom="30">
      <TextInputField className="{navClass}" label="Search Contacts" placeholder="Enter search keyword" value="" type="text" {onInput} {onFocus} {onBlur} />
      {#each options as option}
      <ChatListView chat={option} className="{navClass}" icon={getThumb(option)} />
      {/each}
    </div>
  </div>
</div>

<style>
  .kai-option-menu {
    width: 100%;
    height: calc(100% - 30px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-option-menu > .kai-option-menu-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 84px);
    bottom: 30px;
    position: fixed;
    background-color: #ffffff;
  }
  .kai-option-menu > .kai-option-menu-content > .kai-option-menu-header {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #313131;
    background-color: #cccccc;
    font-weight: normal;
    font-weight: 200;
  }
  .kai-option-menu > .kai-option-menu-content > .kai-option-menu-body {
    width: 100%;
    max-height: calc(100% - 96px);
    overflow: scroll;
  }
</style>
