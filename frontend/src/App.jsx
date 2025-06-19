// 在 useEffect 中的 generateShareLink 函数里修改
const generateShareLink = async () => {
  if (!html.trim()) {
    setShareUrl('');
    return;
  }

  try {
    setIsLoading(true);
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setShareUrl(`${window.location.origin}/view/${data.id}`);
    } else {
      console.error('生成链接失败');
      setShareUrl('');
    }
  } catch (err) {
    console.error('网络错误:', err);
    setShareUrl('');
  } finally {
    setIsLoading(false);
  }
};
