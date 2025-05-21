<script>
  import { onMount } from 'svelte';
  import { goto } from "$app/navigation";
  
  let mqttStatus = 'Checking...';
  let connectionMessage = '';
  let loading = false;
  
  // Check MQTT connection status
  async function checkMqttStatus() {
    try {
      const response = await fetch('/api/mqtt/status');
      const data = await response.json();
      
      mqttStatus = data.connected ? 'Connected' : 'Not Connected';
      connectionMessage = data.message || '';
    } catch (error) {
      mqttStatus = 'Error';
      connectionMessage = `Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  // Connect to MQTT server
  async function connectToMqtt() {
    loading = true;
    mqttStatus = 'Connecting...';
    
    try {
      const response = await fetch('/api/mqtt/connect', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        mqttStatus = 'Connected';
        connectionMessage = data.message || 'Successfully connected to MQTT broker!';
      } else {
        mqttStatus = 'Connection Failed';
        connectionMessage = data.error || 'Failed to connect to MQTT broker';
      }
    } catch (error) {
      mqttStatus = 'Error';
      connectionMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      loading = false;
    }
  }
  
  function gotoAuth() {
    goto('/auth');
  }
  
  // Check status on page load
  onMount(() => {
    checkMqttStatus();
  });
</script>

<div class="min-h-screen bg-gray-100 p-8">
  <div class="max-w-md mx-auto">
    <h1 class="text-3xl font-bold mb-6">E-Farmery Dashboard</h1>
    
    <div class="bg-white p-6 rounded shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">MQTT Server Status</h2>
      
      <div class="mb-4">
        <p class="mb-2">
          Status: 
          <span class={mqttStatus === 'Connected' 
            ? 'text-green-600 font-semibold' 
            : mqttStatus === 'Not Connected' 
              ? 'text-yellow-600 font-semibold'
              : mqttStatus === 'Checking...'
                ? 'text-blue-600 font-semibold'
                : 'text-red-600 font-semibold'}>
            {mqttStatus}
          </span>
        </p>
        
        {#if connectionMessage}
          <p class="text-sm text-gray-600 mt-1">{connectionMessage}</p>
        {/if}
      </div>
      
      <div class="flex space-x-4">
        <button 
          on:click={connectToMqtt}
          disabled={loading || mqttStatus === 'Connected'}
          class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded">
          {loading ? 'Connecting...' : 'Connect to MQTT'}
        </button>
        
        <button 
          on:click={checkMqttStatus}
          disabled={loading}
          class="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded">
          Refresh Status
        </button>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded shadow-md">
      <h2 class="text-xl font-semibold mb-4">E-Farmery Controls</h2>
      
      <button 
        on:click={gotoAuth}
        class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
        Go to Authentication
      </button>
    </div>
  </div>
</div>