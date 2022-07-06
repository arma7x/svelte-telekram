<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';
  import ListView from './ListView.svelte';
  import Checkbox from './Checkbox.svelte';

  export let title: string = 'Single Selector';
  export let focusIndex: number = 0;
  export let options: { title: string, subtitle: string, checked: boolean }[];
  export let softKeyLeftText: string = '';
  export let softKeyCenterTextSelect: string = 'SELECT';
  export let softKeyCenterTextDeselect: string = 'DESELECT';
  export let softKeyRightText: string = '';
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
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        const children = navClasses[this.verticalNavIndex].children
        const keys = Object.keys(children);
        for (var c in keys) {
          children[c].click();
        }
      }
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, {options});
    },
    arrowUpListener: function(evt) {
      evt.preventDefault();
      this.navigateListNav(-1);
      renderCenterKey(this.verticalNavIndex);
    },
    arrowDownListener: function(evt) {
      evt.preventDefault();
      this.navigateListNav(1);
      renderCenterKey(this.verticalNavIndex);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function onCheckboxChange(scope) {
    options[scope.key].checked = scope.checked;
    renderCenterKey(scope.key);
  }

  function renderCenterKey(index) {
    if (options[index].checked) {
      softwareKey.setCenterText(softKeyCenterTextDeselect);
    } else {
      softwareKey.setCenterText(softKeyCenterTextSelect);
    }
  }

  onMount(() => {
    navInstance.attachListener(focusIndex + 1);
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: softKeyLeftText,
        centerText: '',
        rightText: softKeyRightText
      }
    });
    renderCenterKey(focusIndex);
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
        <Checkbox slot="rightWidget" key={i} checked="{option.checked}" onChange={onCheckboxChange} />
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
