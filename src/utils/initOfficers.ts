export async function initializeOfficers() {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-officers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    console.log('Officer initialization result:', data);
    return data;
  } catch (error) {
    console.error('Error initializing officers:', error);
    return { error };
  }
}
