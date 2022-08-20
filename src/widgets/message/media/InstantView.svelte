<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../../../utils/navigation';
  import {
    PageBlockUnsupported, PageBlockTitle, PageBlockSubtitle, PageBlockAuthorDate, PageBlockHeader, PageBlockSubheader, PageBlockParagraph, PageBlockPreformatted, PageBlockFooter, PageBlockDivider, PageBlockAnchor, PageBlockList, PageBlockBlockquote, PageBlockPullquote, PageBlockPhoto, PageBlockVideo, PageBlockCover, PageBlockEmbed, PageBlockEmbedPost, PageBlockCollage, PageBlockSlideshow, PageBlockChannel, PageBlockAudio, PageBlockKicker, PageBlockTable, PageBlockOrderedList, PageBlockDetails, PageBlockRelatedArticles, PageBlockMap
  } from './blocks';

  export let blocks: any[];
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

  function resolveBlockWidget(block) {
    let component = PageBlockUnsupported;
    switch (block.className) {
      case "PageBlockTitle":
        component = PageBlockTitle;
        break;
      case "PageBlockSubtitle":
        component = PageBlockSubtitle;
        break;
      case "PageBlockAuthorDate":
        component = PageBlockAuthorDate;
        break;
      case "PageBlockHeader":
        component = PageBlockHeader;
        break;
      case "PageBlockSubheader":
        component = PageBlockSubheader;
        break;
      case "PageBlockParagraph":
        component = PageBlockParagraph;
        break;
      case "PageBlockPreformatted":
        component = PageBlockPreformatted;
        break;
      case "PageBlockFooter":
        component = PageBlockFooter;
        break;
      case "PageBlockDivider":
        component = PageBlockDivider;
        break;
      case "PageBlockAnchor":
        component = PageBlockAnchor;
        break;
      case "PageBlockList":
        component = PageBlockList;
        break;
      case "PageBlockBlockquote":
        component = PageBlockBlockquote;
        break;
      case "PageBlockPullquote":
        component = PageBlockPullquote;
        break;
      case "PageBlockPhoto":
        component = PageBlockPhoto;
        break;
      case "PageBlockVideo":
        component = PageBlockVideo;
        break;
      case "PageBlockCover":
        component = PageBlockCover;
        break;
      case "PageBlockEmbed":
        component = PageBlockEmbed;
        break;
      case "PageBlockEmbedPost":
        component = PageBlockEmbedPost;
        break;
      case "PageBlockCollage":
        component = PageBlockCollage;
        break;
      case "PageBlockSlideshow":
        component = PageBlockSlideshow;
        break;
      case "PageBlockChannel":
        component = PageBlockChannel;
        break;
      case "PageBlockAudio":
        component = PageBlockAudio;
        break;
      case "PageBlockKicker":
        component = PageBlockKicker;
        break;
      case "PageBlockTable":
        component = PageBlockTable;
        break;
      case "PageBlockOrderedList":
        component = PageBlockOrderedList;
        break;
      case "PageBlockDetails":
        component = PageBlockDetails;
        break;
      case "PageBlockRelatedArticles":
        component = PageBlockRelatedArticles;
        break;
      case "PageBlockMap":
        component = PageBlockMap;
        break;
      default:
        component = PageBlockUnsupported
    }
    return component;
  }

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
      {#each blocks as block}
        <svelte:component this={resolveBlockWidget(block)} block={block} />
      {/each}
    </div>
  </div>
</div>

<style>
  .kai-option-menu {
    width: 100%;
    min-height: calc(100% - 26px);
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
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
