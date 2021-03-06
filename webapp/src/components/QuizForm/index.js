import React, { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, DatePicker, Slider, InputNumber } from "antd";
import axios from 'axios';
import './quizForm.css';
import { getBaseUrl } from "../../common/config";
import { getToken } from "../../auth/utils";

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
    },
};
const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 30,
            offset: 0,
        },
        sm: {
            span: 30,
            offset: 10,
        },
    },
};

const QuizForm = (props) => {

    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();
    const [value, setValue] = useState(0);

    const onFinish = async form => {
        form.date = form.date._d.valueOf();
        const classroom = location.pathname.split('/')[2];
        if (!classroom) return;
        await axios.post(`${getBaseUrl()}/classrooms/${classroom}/quiz`, form, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });
        navigate('/dashboard');
    }

    const onFinishFailed = e => { }

    const dateValidation = current => current && current < Date.now()

    const onDurationChange = value => {
        if (value > 240) value = 240;
        if (value < 1) value = 1;
        form.setFieldsValue({ duration: value });
        setValue(value);
    }

    return (
        <div className="form-container">
            <Card className="form">
                <Form form={form} {...formItemLayout} name="register" initialValues={{ remember: true }}
                    onFinish={onFinish} onFinishFailed={onFinishFailed}>

                    <Form.Item label="Name" name="name"
                        rules={[{ required: true, message: 'Please input your name!' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Please set quiz date!' }]}>
                        <DatePicker showTime disabledTime={dateValidation} disabledDate={dateValidation} />
                    </Form.Item>

                    <Form.Item label="Duration (min)" name="duration" rules={[{ required: true, message: 'Please set quiz duration!' }]}>
                        <Slider min={1} max={240} onChange={onDurationChange} value={value} />
                        <InputNumber onChange={onDurationChange} value={value} min={1} max={240} />
                    </Form.Item>

                    <Form.Item {...tailFormItemLayout}>
                        <Button type="primary" htmlType="submit"> Create quiz </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default QuizForm;
