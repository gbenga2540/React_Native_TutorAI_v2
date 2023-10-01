export interface INTF_ChatGPT {
    role: 'user' | 'assistant' | 'system';
    content: string;
    is_writing_text?: boolean;
}
