<script lang="ts">
  export let key:any;
  export let selected: boolean = false;
  export let onChange: Function = (params: { key: any, selected: boolean }) => {};
  const onClick: Function = (evt) => {
    selected = !selected;
    onChange({key, selected});
  };
</script>

<span style="font-size:20px;" class="{selected ? 'kai-icon-radio-button-selected' : 'kai-icon-radio-button-unselected'}" on:click={onClick}></span>

<style>
</style>
