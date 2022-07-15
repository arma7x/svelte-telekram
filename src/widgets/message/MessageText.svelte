<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../../utils/navigation';

  export let key: any = '';
  export let type: string = '';
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let registerkeyEvent: Function = (id, instance) => {}

  let navOptions = {
    softkeyLeftListener: function(evt) {
      console.log('propagated softkeyLeftListener to:', message.id.toString());
    },
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {}
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    // console.log(message);
    // todo kai-list-view-content align-items if type => group/bot/user
    // todo render message.media if !null
    registerkeyEvent(message.id.toString(), navInstance);
  });

</script>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick}>
  <div class="kai-list-view-content" style="align-items:{type === 'channel' ? 'start' : 'end'};">
    <p>{message.message || 'WIP'}</p>
  </div>
</div>

<style>
  .kai-list-view {
    background-color: transparent;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: start;
    box-sizing: border-box;
    max-height: 100px;
    width: 100%;
    font-size: 14px;
    overflow: hidden;
    padding: 4px 0 4px 4px;
  }

  .kai-list-view > .kai-list-view-content {
    box-sizing: border-box;
    padding: 8px!important;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 0px 4px 0px 0px;
    max-width: calc(100% - 80px);
  }

  .kai-list-view > .kai-list-view-content > p {
    background-color: transparent;
    padding: 0px;
    margin: 0px;
    font-weight: 400;
    color: #323232;
    font-size: 14px;
    text-align: start;
    white-space: pre-wrap!important;
    word-break: break-word!important;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    display: table-cell;
    vertical-align: middle;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
    color: #ffffff;
  }
</style>
