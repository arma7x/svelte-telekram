<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../../../utils/navigation';

  export let template: string = '';
  export let onEnter: Function = (evt) => {};
  export let onBackspace: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};

  let nodeRef;

  let navOptions = {
    arrowUpListener: function(evt) {
      nodeRef.scrollTop -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      nodeRef.scrollTop += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      nodeRef.scrollLeft -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      nodeRef.scrollLeft += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      onEnter(evt);
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    navInstance.attachListener();
    onOpened();
  })

  onDestroy(() => {
    navInstance.detachListener();
    onClosed();
  })

</script>

<svelte:options accessors immutable={true}/>

<div class="kai-option-menu">
  <div class="kai-option-menu-content">
    <div bind:this={nodeRef} class="kai-option-menu-body" data-pad-top="26" data-pad-bottom="0">
      {@html template}
    </div>
  </div>
</div>

<style>
  .kai-option-menu {
    padding: 4px;
    width: 100%;
    min-height: calc(100% - 26px);
    position: fixed;
    background-color: #ffffff;
  }
  .kai-option-menu > .kai-option-menu-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: calc(100% - 26px);
    max-height: calc(100% - 26px);
    position: fixed;
    background-color: #ffffff;
  }
  .kai-option-menu > .kai-option-menu-content > .kai-option-menu-body {
    width: 100%;
    max-height: calc(100% - 26px);
    overflow: scroll;
  }
</style>
