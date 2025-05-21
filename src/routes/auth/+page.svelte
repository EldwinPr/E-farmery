<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  interface User {
    name: string;
    email: string;
  }
  
  let activeTab = 'login';
  let email = '';
  let password = '';
  let name = '';
  let error = '';
  let success = '';
  let user: User | null = null;
  let loading = false;
  
  // Check if user is already logged in
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      
      if (data.authenticated) {
        user = data.user;
      }
    } catch (err) {
      console.error('Error checking authentication status:', err);
    }
  });
  
  async function handleLogin() {
    error = '';
    success = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || 'Login failed';
        return;
      }
      
      user = data.user;
      success = 'Logged in successfully!';
      email = '';
      password = '';
      
    } catch (err) {
      console.error('Login error:', err);
      error = 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  }
  
  async function handleRegister() {
    error = '';
    success = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.error || 'Registration failed';
        return;
      }
      
      user = data.user;
      success = 'Account created successfully!';
      name = '';
      email = '';
      password = '';
      
    } catch (err) {
      console.error('Registration error:', err);
      error = 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  }
  
  async function handleLogout() {
    error = '';
    success = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        user = null;
        success = 'Logged out successfully!';
      }
    } catch (err) {
      console.error('Logout error:', err);
      error = 'Failed to log out';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    {#if user}
      <div class="text-center">
        <h2 class="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
        <p class="mb-4">You are logged in as {user.email}</p>
        
        {#if success}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        {/if}
        
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        {/if}
        
        <button 
          on:click={handleLogout}
          disabled={loading}
          class="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium">
          {loading ? 'Loading...' : 'Logout'}
        </button>
      </div>
    {:else}
      <div>
        <div class="flex border-b mb-4">
          <button 
            class="flex-1 py-2 font-medium {activeTab === 'login' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}"
            on:click={() => activeTab = 'login'}>
            Login
          </button>
          <button 
            class="flex-1 py-2 font-medium {activeTab === 'register' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}"
            on:click={() => activeTab = 'register'}>
            Register
          </button>
        </div>
        
        {#if success}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        {/if}
        
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        {/if}
        
        {#if activeTab === 'login'}
          <form on:submit|preventDefault={handleLogin} class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                bind:value={email}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                bind:value={password}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium">
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        {:else}
          <form on:submit|preventDefault={handleRegister} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                id="name" 
                bind:value={name}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                bind:value={email}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                bind:value={password}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium">
              {loading ? 'Loading...' : 'Register'}
            </button>
          </form>
        {/if}
      </div>
    {/if}
  </div>
</div>