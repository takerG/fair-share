import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export function useRoomSync(roomId, localUserName, isCreator) {
    const [participants, setParticipants] = useState([]);
    const [items, setItems] = useState([]);
    const [allocations, setAllocations] = useState({});
    const [isSynced, setIsSynced] = useState(false);

    const docRef = useRef(null);
    const providerRef = useRef(null);

    // 生成每次运行时的唯一身份ID，存入ref避免变化
    const localUserId = useRef('p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

    useEffect(() => {
        if (!roomId) return;

        const doc = new Y.Doc();
        // 使用公共 WebRTC 信号服务器
        const provider = new WebrtcProvider('jikou-room-' + roomId, doc, {
            signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
        });

        const yParticipants = doc.getArray('participants');
        const yItems = doc.getArray('items');
        const yAllocations = doc.getMap('allocations');

        const updateState = () => {
            setParticipants(yParticipants.toArray());
            setItems(yItems.toArray());
            setAllocations(yAllocations.toJSON());
            setIsSynced(true);
        };

        yParticipants.observe(updateState);
        yItems.observe(updateState);
        yAllocations.observe(updateState);

        // 初始化提取
        updateState();

        // 如果本人有名字，则尝试把自己加入 Participants 列表
        if (localUserName) {
            setTimeout(() => {
                doc.transact(() => {
                    const currentPs = yParticipants.toArray();
                    if (!currentPs.find(p => p.id === localUserId.current)) {
                        yParticipants.push([{ id: localUserId.current, name: localUserName, isCreator }]);
                    }
                });
            }, 500); // 略微延迟等待远端同步
        }

        docRef.current = doc;
        providerRef.current = provider;

        return () => {
            provider.destroy();
            doc.destroy();
            setIsSynced(false);
        };
    }, [roomId, localUserName, isCreator]);

    // 同步 React 的 setState 到 Yjs
    const syncSetParticipants = (newOrUpdater) => {
        if (!docRef.current) return;
        const yParticipants = docRef.current.getArray('participants');
        const nextVal = typeof newOrUpdater === 'function' ? newOrUpdater(yParticipants.toArray()) : newOrUpdater;

        docRef.current.transact(() => {
            yParticipants.delete(0, yParticipants.length);
            yParticipants.insert(0, nextVal);
        });
    };

    const syncSetItems = (newOrUpdater) => {
        if (!docRef.current) return;
        const yItems = docRef.current.getArray('items');
        const nextVal = typeof newOrUpdater === 'function' ? newOrUpdater(yItems.toArray()) : newOrUpdater;

        docRef.current.transact(() => {
            yItems.delete(0, yItems.length);
            yItems.insert(0, nextVal);
        });
    };

    const syncSetAllocations = (newOrUpdater) => {
        if (!docRef.current) return;
        const yAllocations = docRef.current.getMap('allocations');
        const nextVal = typeof newOrUpdater === 'function' ? newOrUpdater(yAllocations.toJSON()) : newOrUpdater;

        docRef.current.transact(() => {
            // 移除在 nextVal 中不存在的 key
            for (const key of yAllocations.keys()) {
                if (!nextVal.hasOwnProperty(key)) yAllocations.delete(key);
            }
            // 添加或更新 key
            for (const [k, v] of Object.entries(nextVal)) {
                yAllocations.set(k, v);
            }
        });
    };

    return {
        participants, setParticipants: syncSetParticipants,
        items, setItems: syncSetItems,
        allocations, setAllocations: syncSetAllocations,
        localUserId: localUserId.current,
        isSynced
    };
}
