import { useState } from 'react';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  Send,
  Bot,
  User,
  HelpCircle,
  Package,
  Truck,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/constants';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function SupportPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm Express Prime's AI support assistant. How can I help you today? I can answer questions about orders, shipping, returns, and products."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const quickReplies = [
    "Where is my order?",
    "How do I return an item?",
    "Shipping information",
    "Payment issues"
  ];

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    let response = "I understand you're asking about that. Let me help you!";

    if (userMessage.toLowerCase().includes('order') || userMessage.toLowerCase().includes('track')) {
      response = "To track your order, visit our Order Tracking page and enter your order number and email. You'll see real-time status updates including shipping carrier and tracking number. Orders typically ship within 1-2 business days.";
    } else if (userMessage.toLowerCase().includes('return') || userMessage.toLowerCase().includes('refund')) {
      response = "We offer a 30-day hassle-free return policy! Items must be unused and in original packaging. To start a return, go to Order Tracking, find your order, and click 'Request Return'. Refunds are processed within 5-7 business days.";
    } else if (userMessage.toLowerCase().includes('shipping')) {
      response = "We offer free standard shipping on orders over $49. Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for $9.99. All orders include tracking numbers sent via email.";
    } else if (userMessage.toLowerCase().includes('payment')) {
      response = "We accept all major credit cards (Visa, MasterCard, Amex, Discover), PayPal, and Shop Pay. All transactions are secured with 256-bit SSL encryption. If your payment was declined, please verify your card details or contact your bank.";
    }

    setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  const handleQuickReply = (reply: string) => {
    setChatInput(reply);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
  };

  const faqItems = [
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available at checkout. Orders over $49 qualify for free standard shipping.",
      icon: Truck
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day hassle-free return policy. Items must be unused and in original packaging. Simply visit Order Tracking to initiate a return.",
      icon: RotateCcw
    },
    {
      question: "How can I track my order?",
      answer: "Visit our Order Tracking page and enter your order number along with the email used during checkout. You'll see real-time shipping updates.",
      icon: Package
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept Visa, MasterCard, American Express, Discover, PayPal, and Shop Pay. All transactions are secured with industry-standard encryption.",
      icon: CreditCard
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">How Can We Help?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get instant answers with our AI support assistant, browse FAQs, 
            or contact our human team for complex issues.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* AI Chat Widget */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-gradient-blue text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Support Assistant</CardTitle>
                  <CardDescription className="text-white/80">
                    Usually responds instantly
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                        message.role === 'user'
                          ? "bg-primary text-white"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} className="btn-glow">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact Human Support
              </CardTitle>
              <CardDescription>
                For complex issues, submit a ticket and our team will respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticketSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ticket Submitted!</h3>
                  <p className="text-muted-foreground">
                    We'll get back to you within 24 hours at the email provided.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                        <SelectItem value="return">Return/Refund</SelectItem>
                        <SelectItem value="product">Product Question</SelectItem>
                        <SelectItem value="payment">Payment Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number (optional)</Label>
                    <Input id="orderNumber" placeholder="EP-XXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={4} 
                      placeholder="Describe your issue in detail..."
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full btn-glow">
                    Submit Ticket
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-muted-foreground text-sm">{BRAND.email}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-muted-foreground text-sm">{BRAND.phone}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Hours</h3>
              <p className="text-muted-foreground text-sm">Mon-Fri: 9AM-6PM EST</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            <HelpCircle className="w-6 h-6 inline mr-2 text-primary" />
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
