import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import './dashboard.css'
import { Menu } from "antd";
import { logout } from "../../auth/utils";

const { Item } = Menu;

const menuStyle = {
    backgroundColor: 'black',
    color: 'white',
    fontSize: '16px'
}

export default (props) => {

    const [current, setCurrent] = useState('classroom');
    const navigate = useNavigate();

    const handleClick = e => {
        setCurrent(e.key);
        switch (e.key) {
            case 'quiz':
                navigate('/dashboard/quizzes');
                break;
            case 'classroom':
                navigate('/dashboard');
                break;
            case 'logout':
                logout();
                navigate('/login');
                break;
            default:
                break;
        }
    }

    return (
        <div className="dashboard">
            <div className="header">
                <div className="left-menu">
                    <Menu selectedKeys={[current]} onClick={handleClick} mode={`horizontal`} theme={`dark`} style={menuStyle}>
                        <Item key={`classroom`}>Classrooms</Item>
                        <Item key={`quiz`}>Quizzes</Item>
                        <Item key={`logout`}>Log out</Item>
                    </Menu>
                </div>
                <div className="right-menu">
                </div>
            </div>
            <div className="main">
                <div className="main-container">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

