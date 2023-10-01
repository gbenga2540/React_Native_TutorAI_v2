import { INTF_AssignedClass } from '../Assigned_Class/Assigned_Class';

export type INTF_WritingTest = {
    id: number;
    englishLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    question: string[];
};

export type INTF_WritingAnswer = {
    id: number;
    englishLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    level: INTF_AssignedClass;
    question: string;
};
