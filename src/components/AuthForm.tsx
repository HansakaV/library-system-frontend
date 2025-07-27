import {useState} from "react";
import { Input } from "./Input";
import { Button } from "./Button";

interface AuthFormProps {
    type: 'login' | 'signup';
    onSubmit: (data: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'signup' && password !== confirmPassword) {
            console.error("Passwords do not match!");
            return;
        }
        onSubmit({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {type === 'signup' && (
                <Input
                    label="Confirm Password"
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            )}
            <div>
                <Button type="submit" className="w-full">
                    {type === 'login' ? 'Sign in' : 'Sign up'}
                </Button>
            </div>
        </form>
    );
};

export default AuthForm;