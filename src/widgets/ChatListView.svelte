<script lang="ts">
  export let key:any = '';
  export let title: string = '';
  export let subtitle: string = null;
  export let className: string = null;
  export let onClick: Function = (evt) => {}
</script>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick}>
  {#if $$slots.leftWidget}
  <slot name="leftWidget"></slot>
  {/if}
  <slot>
    <div class="kai-list-view-content">
      <p>{title}</p>
      {#if subtitle}<small>{subtitle}</small>{/if}
    </div>
  </slot>
  <slot name="rightWidget"><span class="kai-icon-arrow"></span></slot>
</div>

<style>
  .kai-list-view {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    box-sizing: border-box;
    padding: 0px 8px;
    height: 60px;
    width: 100%;
    font-size: 14px;
  }

  .kai-list-view > .kai-list-view-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    padding: 0px 4px 0px 0px;
    width: 100%;
  }

  .kai-list-view > .kai-list-view-content > p {
    padding: 0px;
    margin: 0px;
    font-weight: 400;
    color: #323232;
    font-size: 14px;
    text-align: start;
    height: 20px;
    width: 100%;
    white-space: pre-wrap!important;
    word-break: break-word!important;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  .kai-list-view > .kai-list-view-content > small {
    padding: 0px;
    font-size: 12px;
    color: #6A6A6A;
    text-align: start;
    vertical-align: middle;
  }

  .kai-list-view > span {
    color: #6B6B6B;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content > p,
  .kai-list-view.focus > .kai-list-view-content > small,
  .kai-list-view.focus > span {
    background-color: var(--themeColor);
    color: #ffffff;
  }
</style>
