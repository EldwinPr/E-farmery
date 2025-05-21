<script>
	import { goto } from "$app/navigation";

    async function gotoAuth() {
        goto('/auth');
    }
</script>

<button on:click={gotoAuth}>
    Go to Auth
</button>