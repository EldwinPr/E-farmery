<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  // Device state
  let devices: Array<any> = [];
  let selectedDevice: any = null;
  let newDeviceName = '';
  let newDeviceLocation = '';
  
  // MQTT state
  let mqttStatus = 'Checking...';
  let connectionMessage = '';
  
  // Valve control
  let irrigationDuration = 60;
  let valveState = false;
  let loading = {
    mqtt: false,
    devices: false,
    valve: false,
    register: false
  };
  let error = {
    mqtt: '',
    devices: '',
    valve: '',
    register: ''
  };
  
  // Load all devices
  async function loadDevices() {
    loading.devices = true;
    error.devices = '';
    
    try {
      const response = await fetch('/api/devices');
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      devices = data.devices || [];
      
      if (devices.length > 0) {
        selectedDevice = devices[0];
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      error.devices = 'Failed to load devices';
    } finally {
      loading.devices = false;
    }
  }
  
  // Register a new device
  async function registerDevice() {
    if (!newDeviceName) {
      error.register = 'Device name is required';
      return;
    }
    
    loading.register = true;
    error.register = '';
    
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newDeviceName,
          location: newDeviceLocation
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add new device to list and select it
      devices = [...devices, data.device];
      selectedDevice = data.device;
      
      // Clear form
      newDeviceName = '';
      newDeviceLocation = '';
      
    } catch (err) {
      console.error('Error registering device:', err);
      error.register = 'Failed to register device';
    } finally {
      loading.register = false;
    }
  }
  
  // Handle device selection change
  function handleDeviceChange(event: Event) {
    const deviceId = (event.target as HTMLSelectElement).value;
    selectedDevice = devices.find(d => d.id === deviceId) || null;
  }
  
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
    loading.mqtt = true;
    mqttStatus = 'Connecting...';
    error.mqtt = '';
    
    try {
      const response = await fetch('/api/mqtt/connect', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        mqttStatus = 'Connected';
        connectionMessage = data.message || 'Successfully connected to MQTT broker!';
      } else {
        mqttStatus = 'Connection Failed';
        error.mqtt = data.error || 'Failed to connect to MQTT broker';
      }
    } catch (err) {
      mqttStatus = 'Error';
      error.mqtt = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    } finally {
      loading.mqtt = false;
    }
  }
  
  // Control the valve
  async function controlValve(state: boolean) {
    if (!selectedDevice) {
      error.valve = 'No device selected';
      return;
    }
    
    loading.valve = true;
    error.valve = '';
    valveState = state;
    
    try {
      const response = await fetch(`/api/devices/${selectedDevice.id}/valve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state,
          duration: irrigationDuration
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      // If turning off valve, no need to do anything else
      if (!state) {
        return;
      }
      
    } catch (err) {
      console.error('Error controlling valve:', err);
      error.valve = 'Failed to control valve';
      valveState = !state; // Revert state on error
    } finally {
      loading.valve = false;
    }
  }
  
  // Initialize on page load
  onMount(() => {
    checkMqttStatus();
    loadDevices();
  });
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">E-Farmery Dashboard</h1>
    
    <!-- MQTT Connection Status -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 class="text-lg font-semibold mb-2">MQTT Connection</h2>
      
      <div class="flex items-center justify-between">
        <div>
          <span class="text-sm mr-2">Status:</span>
          <span class={mqttStatus === 'Connected' 
            ? 'text-green-600 font-medium' 
            : mqttStatus === 'Not Connected' 
              ? 'text-yellow-600 font-medium'
              : 'text-red-600 font-medium'}>
            {mqttStatus}
          </span>
          
          {#if error.mqtt}
            <p class="text-red-500 text-sm mt-1">{error.mqtt}</p>
          {/if}
        </div>
        
        <button 
          on:click={connectToMqtt}
          disabled={loading.mqtt || mqttStatus === 'Connected'}
          class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 text-sm rounded">
          {loading.mqtt ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
    
    <!-- Device Management -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Device Selection -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-lg font-semibold mb-4">Your Devices</h2>
        
        {#if loading.devices}
          <p class="text-gray-500">Loading devices...</p>
        {:else if error.devices}
          <p class="text-red-500">{error.devices}</p>
          <button
            class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded"
            on:click={loadDevices}
          >
            Retry
          </button>
        {:else if devices.length === 0}
          <p class="text-gray-500">You don't have any devices yet.</p>
        {:else}
          <div class="mb-4">
            <label for="device-select" class="block text-sm font-medium text-gray-700 mb-1">
              Select Device
            </label>
            <select
              id="device-select"
              class="w-full p-2 border border-gray-300 rounded"
              on:change={handleDeviceChange}
              value={selectedDevice?.id}
            >
              {#each devices as device}
                <option value={device.id}>
                  {device.name} {device.isOnline ? '(Online)' : '(Offline)'}
                </option>
              {/each}
            </select>
          </div>
          
          {#if selectedDevice}
            <div class="text-sm">
              <p><span class="font-medium">ID:</span> {selectedDevice.id}</p>
              <p><span class="font-medium">Location:</span> {selectedDevice.location || 'Not specified'}</p>
              <p>
                <span class="font-medium">Status:</span>
                {#if selectedDevice.isOnline}
                  <span class="text-green-500">Online</span>
                {:else}
                  <span class="text-red-500">Offline</span>
                {/if}
              </p>
              <p>
                <span class="font-medium">Last Seen:</span>
                {selectedDevice.lastSeen ? new Date(selectedDevice.lastSeen).toLocaleString() : 'Never'}
              </p>
            </div>
          {/if}
        {/if}
      </div>
      
      <!-- Register New Device -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-lg font-semibold mb-4">Register New Device</h2>
        
        <form on:submit|preventDefault={registerDevice} class="space-y-3">
          <div>
            <label for="device-name" class="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              id="device-name"
              bind:value={newDeviceName}
              class="w-full p-2 border border-gray-300 rounded"
              placeholder="E.g., Garden Sensor 1"
            />
          </div>
          
          <div>
            <label for="device-location" class="block text-sm font-medium text-gray-700 mb-1">
              Location (Optional)
            </label>
            <input
              type="text"
              id="device-location"
              bind:value={newDeviceLocation}
              class="w-full p-2 border border-gray-300 rounded"
              placeholder="E.g., Backyard"
            />
          </div>
          
          {#if error.register}
            <p class="text-red-500 text-sm">{error.register}</p>
          {/if}
          
          <button
            type="submit"
            disabled={loading.register}
            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 rounded"
          >
            {loading.register ? 'Registering...' : 'Register Device'}
          </button>
        </form>
      </div>
    </div>
    
    <!-- Irrigation Control -->
    {#if selectedDevice}
      <div class="bg-white rounded-lg shadow-md p-4">
        <h2 class="text-lg font-semibold mb-4">Irrigation Control</h2>
        
        <div class="mb-4">
          <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
            Irrigation Duration (seconds)
          </label>
          <input
            type="number"
            id="duration"
            bind:value={irrigationDuration}
            min="5"
            max="300"
            class="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {#if error.valve}
          <p class="text-red-500 text-sm mb-3">{error.valve}</p>
        {/if}
        
        <div class="flex space-x-4">
          <button
            on:click={() => controlValve(true)}
            disabled={loading.valve || valveState || mqttStatus !== 'Connected'}
            class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium"
          >
            {loading.valve ? 'Processing...' : valveState ? 'Valve Open' : 'Open Valve'}
          </button>
          
          <button
            on:click={() => controlValve(false)}
            disabled={loading.valve || !valveState || mqttStatus !== 'Connected'}
            class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium"
          >
            {loading.valve ? 'Processing...' : 'Close Valve'}
          </button>
        </div>
        
        {#if mqttStatus !== 'Connected'}
          <p class="text-yellow-600 text-sm mt-3">
            Connect to MQTT server to control the valve.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>