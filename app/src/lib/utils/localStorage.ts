const getItem = (key: string) => {
  const storedState = localStorage.getItem(key);
  if (storedState) {
    return JSON.parse(storedState);
  }
  return undefined;
};

const setItem = (key: string, value: any) => {
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export { getItem, setItem };
