<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';
  import ListView from './ListView.svelte';

  const navClass: string = 'optionMenuNav';

  export let title: string = 'Option Menu';
  export let focusIndex: number = 0;
  export let options: { title: string, subtitle: string, icon: any }[];
  export let softKeyLeftText: string = '';
  export let softKeyCenterText: string = 'Close';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, scope) => {};
  export let onBackspace: Function = (evt, scope) => {};
  export let onSoftkeyLeft: Function = (evt, scope) => {};
  export let onSoftkeyRight: Function = (evt, scope) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (scope) => {};

  let softwareKey: SoftwareKey;

  export function setTitleText(text) {
    title = text;
  }

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      onSoftkeyLeft(evt, {index: this.verticalNavIndex, selected: options[this.verticalNavIndex]});
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      onSoftkeyRight(evt, {index: this.verticalNavIndex, selected: options[this.verticalNavIndex]});
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
      {#each options as option}
      <ListView className="{navClass}" title="{option.title}" subtitle="{option.subtitle}">
        <span slot="leftWidget" style="padding-right: 4px;">{@html (option.icon ? option.icon : '')}</span>
        <span slot="rightWidget"></span>
      </ListView>
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
