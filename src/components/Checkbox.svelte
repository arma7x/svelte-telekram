<script lang="ts">
  export let key:any;
  export let checked: boolean = false;
  export let onChange: Function = (params: { key: any, checked: boolean }) => {};
  const onClick: Function = (evt) => {
    checked = !checked;
    onChange({key, checked});
  };
</script>

<span style="font-size:20px;" class="{checked ? 'kai-icon-checkbox-checked' : 'kai-icon-checkbox-unchecked'}" on:click={onClick}></span>

<style>
</style>
