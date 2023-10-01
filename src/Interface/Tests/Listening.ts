import { INTF_AssignedClass } from '../Assigned_Class/Assigned_Class';

export type INTF_ListeningTest = {
    id: number;
    englishLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    question: string;
    options: string[];
    level: INTF_AssignedClass;
};

export type INTF_ListeningAnswers = {
    id: number;
    answer_index: number;
    level: INTF_AssignedClass;
};
