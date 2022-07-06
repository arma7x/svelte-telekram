<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';
  import ListView from './ListView.svelte';
  import Radio from './Radio.svelte';

  export let title: string = 'Single Selector';
  export let focusIndex: number = 0;
  export let options: { title: string, subtitle: string, selected: boolean }[];
  export let softKeyLeftText: string = '';
  export let softKeyCenterText: string = 'SELECT';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, scope) => {};
  export let onBackspace: Function = (evt, scope) => {};
  export let onSoftkeyLeft: Function = (evt, scope) => {};
  export let onSoftkeyRight: Function = (evt, scope) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (scope) => {};

  export function setTitleText(text) {
    title = text;
  }

  const navClass: string = 'singleSelectorNav';
  let softwareKey: SoftwareKey;

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      onSoftkeyLeft(evt, {options});
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      onSoftkeyRight(evt, {options});
    },
    enterListener: function(evt) {
      if (options[this.verticalNavIndex].selected) {
        onEnter(evt, {options});
        return;
      }
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        const children = navClasses[this.verticalNavIndex].children
        const keys = Object.keys(children);
        for (var c in keys) {
          children[c].click();
        }
      }
      onEnter(evt, {options});
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, {options});
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function onRadioChange(scope) {
    options[scope.key].selected = scope.selected;
    options.forEach((o, i) => {
      if (i != scope.key)
        o.selected = false;
    });
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
  })

  onDestroy(() => {
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed({options});
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="kai-option-menu">
  <div class="kai-option-menu-content">
    <div class="kai-option-menu-header">{title}</div>
    <div class="kai-option-menu-body" data-pad-top="66" data-pad-bottom="30">
      {#each options as option, i}
      <ListView className="{navClass}" title="{option.title}" subtitle="{option.subtitle}">
        <Radio slot="rightWidget" key={i} selected="{option.selected}" onChange={onRadioChange} />
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
