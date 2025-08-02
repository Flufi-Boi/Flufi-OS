function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("FCLEditor", 1);

        request.onupgradeneeded = (event) => {
            try {
                const db = (event.target as IDBOpenDBRequest).result;
                const store = db.createObjectStore("editor");
                //store.createIndex("input", "input", { unique: true });
                store.add("void main()\n    print(\"hello world\")\n}", "input")
            } catch (err) {
                console.error("grah", err);
            }
        };

        request.onsuccess = () =>
            resolve(request.result);

        request.onerror = () =>
            reject(request.error);
    });
}

export const db = await openDatabase();