import React, { useState, useRef, useEffect } from 'react';
import { useAskCopilotMutation } from '../../redux/features/ai/aiApi';
import {
  RobotOutlined,
  CloseOutlined,
  SendOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  UserOutlined,
  BulbOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import './AICopilot.css';

interface IMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  { label: '👤 Rahul Dave Spend', query: 'How much did Rahul Dave spend?' },
  { label: '👥 Top 3 Customers', query: 'Who are our top 3 spending customers?' },
  { label: '⚠️ Low Stock (< 10)', query: 'Which products have stock less than 10?' },
  { label: '🏆 Best Sellers', query: 'Which products are the top 3 best sellers?' },
  { label: '💰 Store Revenue & Value', query: 'What is the total revenue and inventory value?' },
  { label: '🏭 Supplier Purchases', query: 'How much did we purchase from our suppliers?' },
];

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your **Inventra AI Copilot**. 🤖✨\n\nI have complete 360-degree knowledge of your inventory, sales, customers, and suppliers. Ask me anything about stock, customer spending, top sellers, or supplier orders!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [askCopilot, { isLoading }] = useAskCopilotMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: IMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    try {
      const history = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response: any = await askCopilot({
        message: text,
        history,
      }).unwrap();

      const botReply = response?.data?.reply || 'ક્ષમા કરશો, જવાબ તૈયાર કરવામાં સમસ્યા આવી રહી છે.';

      const botMsg: IMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: IMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ સર્વર કનેક્શનમાં ક્ષતિ આવી છે. કૃપા કરીને થોડી વાર પછી પ્રયાસ કરો.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Chat history cleared. Feel free to ask a new question! 🤖',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Inline text parser for bold, code, currency, and emojis
   */
  const renderInline = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Highlight currency specially
        if (inner.includes('₹') || inner.startsWith('₹')) {
          return (
            <span key={pIdx} className='ai-currency-highlight'>
              {inner}
            </span>
          );
        }
        return (
          <strong key={pIdx} className='ai-strong-text'>
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className='ai-code-chip'>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  /**
   * Advanced Visual Markdown Parser
   */
  const renderVisualMessage = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // 1. Skip empty lines
      if (!line) {
        i++;
        continue;
      }

      // 2. Horizontal Divider
      if (line === '---' || line === '***' || line === '___') {
        elements.push(<hr key={`hr-${i}`} className='ai-visual-divider' />);
        i++;
        continue;
      }

      // 3. Section Headers (### or ## or #)
      if (line.startsWith('#')) {
        const headerText = line.replace(/^#+\s*/, '').trim();
        elements.push(
          <div key={`header-${i}`} className='ai-section-header'>
            <div className='ai-header-sparkle'>
              <StarOutlined />
            </div>
            <h4>{renderInline(headerText)}</h4>
          </div>
        );
        i++;
        continue;
      }

      // 4. Recommendation Block (💡 Recommendation or Recommendation:)
      if (
        line.startsWith('💡') ||
        line.toLowerCase().includes('recommendation:') ||
        line.toLowerCase().startsWith('**recommendation') ||
        line.startsWith('🎯 Strategic') ||
        line.startsWith('⚠️') && line.toLowerCase().includes('alert')
      ) {
        const recLines: string[] = [line];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('---') && !lines[i].trim().startsWith('#')) {
          recLines.push(lines[i].trim());
          i++;
        }
        elements.push(
          <div key={`rec-${i}`} className='ai-recommendation-card'>
            <div className='ai-rec-header'>
              <div className='ai-rec-icon-wrap'>
                <BulbOutlined />
              </div>
              <span className='ai-rec-title'>Copilot Recommendation & Action Plan</span>
            </div>
            <div className='ai-rec-body'>
              {recLines.map((rLine, rIdx) => (
                <div key={rIdx} className='ai-rec-text'>
                  {renderInline(rLine.replace(/^💡\s*(\*\*Recommendation:\*\*|\*\*Recommendation\*\*|Recommendation:)?/i, ''))}
                </div>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 5. Markdown Table Parser
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]
            .split('|')
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map((c) => c.trim());

          // Skip separator line (| :--- | :--- |)
          const dataRows = tableLines.slice(2).map((rowStr) =>
            rowStr
              .split('|')
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
              .map((c) => c.trim())
          );

          elements.push(
            <div key={`table-${i}`} className='ai-table-responsive-wrapper'>
              <table className='ai-modern-table'>
                <thead>
                  <tr>
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx}>{renderInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className={row[0]?.toLowerCase().includes('total') ? 'ai-table-total-row' : ''}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>
                          {cell.includes('₹') ? (
                            <span className='ai-table-amount'>{cell}</span>
                          ) : (
                            renderInline(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 6. Bullet Point List (* or - or •)
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ') || /^\d+\.\s/.test(line)) {
        const cleanItem = line.replace(/^(\*|-|•|\d+\.)\s*/, '').trim();
        elements.push(
          <div key={`list-${i}`} className='ai-bullet-row'>
            <span className='ai-bullet-dot'></span>
            <div className='ai-bullet-content'>{renderInline(cleanItem)}</div>
          </div>
        );
        i++;
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <div key={`p-${i}`} className='ai-text-paragraph'>
          {renderInline(line)}
        </div>
      );
      i++;
    }

    return elements;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <Tooltip title='Inventra AI Copilot — 360° Smart Assistant' placement='left'>
          <button
            className='ai-copilot-trigger'
            onClick={() => setIsOpen(true)}
            aria-label='Open AI Copilot'
          >
            <div className='sparkle-icon'>
              <RobotOutlined style={{ fontSize: '20px' }} />
            </div>
            <span>AI Copilot</span>
          </button>
        </Tooltip>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className='ai-copilot-window'>
          {/* Header */}
          <div className='ai-header'>
            <div className='ai-header-title'>
              <div className='ai-avatar-badge'>
                <RobotOutlined />
              </div>
              <div>
                <h3 className='ai-title-text'>Inventra AI Copilot</h3>
                <div className='ai-status-indicator'>
                  <span className='ai-status-dot'></span>
                  360° Live Database Connected
                </div>
              </div>
            </div>

            <div className='ai-header-actions'>
              <Tooltip title='Clear Chat'>
                <button className='ai-btn-icon' onClick={handleClear}>
                  <ClearOutlined />
                </button>
              </Tooltip>
              <Tooltip title='Close Copilot'>
                <button className='ai-btn-icon' onClick={() => setIsOpen(false)}>
                  <CloseOutlined />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className='ai-quick-prompts'>
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                className='ai-chip'
                onClick={() => handleSend(item.query)}
                disabled={isLoading}
              >
                <ThunderboltOutlined style={{ fontSize: '11px', color: '#6366f1' }} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className='ai-messages-container'>
            {messages.map((m) => (
              <div key={m.id} className={`ai-message ${m.sender}`}>
                <div className={`ai-msg-avatar ${m.sender === 'user' ? 'user-av' : 'bot-av'}`}>
                  {m.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>
                <div className='ai-msg-bubble'>
                  {m.sender === 'bot' ? renderVisualMessage(m.text) : renderInline(m.text)}
                  <span className='ai-msg-time'>{m.time}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className='ai-message bot'>
                <div className='ai-msg-avatar bot-av'>
                  <RobotOutlined />
                </div>
                <div className='ai-typing-indicator'>
                  <div className='ai-typing-dot'></div>
                  <div className='ai-typing-dot'></div>
                  <div className='ai-typing-dot'></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className='ai-input-wrapper'>
            <input
              ref={inputRef}
              type='text'
              className='ai-input-box'
              placeholder="Ask anything in Gujarati, Gujlish or English..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className='ai-send-btn'
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
            >
              <SendOutlined style={{ fontSize: '16px' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AICopilot;

