import React, { useState } from 'react';
import { BountiesRaisedView } from './MyBountiesRaisedView';
import { BountiesSubmittedView } from './MyBountiesSubmittedView';

const MyBountiesTabView: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabClick = (tabIndex: number) => {
        setActiveTab(tabIndex);
    };

    return (
        <div style={styles.tabContainer}>
            <div style={styles.tabHeader}>
                <button
                    style={{
                        ...styles.tabButton,
                        ...(activeTab === 0 ? styles.activeTabButton : {}),
                    }}
                    onClick={() => handleTabClick(0)}
                >
                    <span style={{ color: activeTab === 0 ? 'white' : 'grey' }} >Raised by me</span>
                </button>
                <button
                    style={{
                        ...styles.tabButton,
                        ...(activeTab === 1 ? styles.activeTabButton : {}),
                    }}
                    onClick={() => handleTabClick(1)}
                >

                    <span style={{ color: activeTab === 0 ? 'grey' : 'white' }} >Submitted by me</span>
                </button>
            </div>

            <div
                style={{
                    ...styles.tabContent,
                    transform: `translateX(-${activeTab * 50}%)`,
                }}
            >
                <div style={styles.tabView}>
                    <BountiesRaisedView></BountiesRaisedView>
                </div>

                <div style={styles.tabView}>
                    <BountiesSubmittedView></BountiesSubmittedView>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    tabContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    tabHeader: {
        display: 'flex',
        justifyContent: 'center',
        borderBottom: '1px solid #ccc',
    },
    tabButton: {
        flex: 1,
        padding: '10px',
        cursor: 'pointer',
        textAlign: 'center',
        border: 'none',
        background: '#181818',
        transition: 'background 0.3s ease',
    },
    activeTabButton: {
        background: '#181818',
        color: 'white',
    },
    tabContent: {
        display: 'flex',
        transition: 'transform 0.3s ease',
        width: '200%',
    },
    tabView: {
        flex: 1,
        padding: '20px',
    },
};

export default MyBountiesTabView;