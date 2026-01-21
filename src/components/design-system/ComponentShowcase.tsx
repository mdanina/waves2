import React, { useState } from 'react';
import { WellnessCard } from './WellnessCard';
import { SerifHeading } from './SerifHeading';
import { PillButton } from './PillButton';
import { EmojiSelector } from './EmojiSelector';
import { StatCard } from './StatCard';
import { MoodChart } from './MoodChart';
import { VerticalSlider } from './VerticalSlider';
import { DropdownSelector } from './DropdownSelector';
import { StreakBadge } from './StreakBadge';
import { InfoBadge } from './InfoBadge';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Checkbox } from './Checkbox';
import { RadioGroup } from './Radio';
import { Toggle } from './Toggle';
import { ProgressBar } from './ProgressBar';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './Alert';
import { Timeline } from './Timeline';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Tabs } from './Tabs';
import { Breadcrumbs } from './Breadcrumbs';
import { Pagination } from './Pagination';
import { Tooltip } from './Tooltip';
import { MoodTracker } from './MoodTracker';
import { QuestionCard } from './QuestionCard';
import { ActionCard } from './ActionCard';
import { MoodGraph } from './MoodGraph';
import { DayGreeting } from './DayGreeting';
import { FloatingActionButton } from './FloatingActionButton';
import { CardStack } from './CardStack';
import { DecorativeShaderCircle } from './DecorativeShaderCircle';
import { GradientMesh } from './GradientMesh';
import { ArrowRight, Smile, Clock, Mail, Search, Heart, Calendar, CheckCircle, Activity, Home, TrendingUp } from 'lucide-react';

const mockMoodData = [
  { day: 'M', mood: 5 },
  { day: 'T', mood: 7 },
  { day: 'W', mood: 6 },
  { day: 'T', mood: 8 },
  { day: 'F', mood: 9 },
  { day: 'S', mood: 7 },
];

const emojiOptions = [
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '🤩', label: 'Amazing', value: 'amazing' },
];

export function ComponentShowcase() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodStreak, setMoodStreak] = useState(7);
  const [activeNav, setActiveNav] = useState('insights');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [terms, setTerms] = useState(false);
  const [tags, setTags] = useState(['Meditation', 'Exercise', 'Journaling', 'Mindfulness', 'Sleep']);
  const [questionAnswered, setQuestionAnswered] = useState<string | null>(null);
  const [actionStarted, setActionStarted] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 pb-32">
      <div className="text-center space-y-4">
        <SerifHeading size="4xl">Component Library</SerifHeading>
        <p className="text-lg opacity-70">Complete showcase of all 38 design system components</p>
      </div>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Typography</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs opacity-50 mb-2">SerifHeading - 4xl</p>
              <SerifHeading size="4xl">The Quick Brown Fox</SerifHeading>
            </div>
            <div>
              <p className="text-xs opacity-50 mb-2">SerifHeading - 3xl</p>
              <SerifHeading size="3xl">The Quick Brown Fox</SerifHeading>
            </div>
            <div>
              <p className="text-xs opacity-50 mb-2">SerifHeading - 2xl</p>
              <SerifHeading size="2xl">The Quick Brown Fox</SerifHeading>
            </div>
            <div>
              <p className="text-xs opacity-50 mb-2">SerifHeading - xl</p>
              <SerifHeading size="xl">The Quick Brown Fox</SerifHeading>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Buttons</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs opacity-50">Primary Variant</p>
              <div className="flex flex-wrap gap-3">
                <PillButton variant="primary" size="sm">Small Button</PillButton>
                <PillButton variant="primary" size="md">Medium Button</PillButton>
                <PillButton variant="primary" size="lg">Large Button</PillButton>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Coral Variant</p>
              <div className="flex flex-wrap gap-3">
                <PillButton variant="gradientMesh" size="md">Coral Button</PillButton>
                <PillButton variant="gradientMesh" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  With Icon
                </PillButton>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Secondary & Outline</p>
              <div className="flex flex-wrap gap-3">
                <PillButton variant="secondary" size="md">Secondary</PillButton>
                <PillButton variant="outline" size="md">Outline</PillButton>
              </div>
            </div>
            <div className="space-y-3 border-t pt-6">
              <p className="text-xs opacity-50">Gradient Mesh Buttons</p>
              <p className="text-xs opacity-70 mb-4">
                Кнопки с эффектом переливающихся градиентов (holographic mesh effect). Анимированные цвета создают красивый визуальный эффект.
              </p>
              <div className="flex flex-wrap gap-3">
                <PillButton variant="gradientMesh" size="md">Iridescent</PillButton>
                <PillButton variant="gradientMeshPeach" size="md">Peach Lavender</PillButton>
                <PillButton variant="gradientMeshMint" size="md">Mint Sky</PillButton>
                <PillButton variant="gradientMeshRose" size="md">Rose Yellow</PillButton>
                <PillButton variant="gradientMeshCoral" size="md">Coral Blue</PillButton>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <PillButton variant="gradientMesh" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  With Icon
                </PillButton>
                <PillButton variant="gradientMeshPeach" size="sm">Small</PillButton>
                <PillButton variant="gradientMeshMint" size="lg">Large</PillButton>
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Cards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <WellnessCard>
            <h3 className="font-medium mb-2">Default Card</h3>
            <p className="text-sm opacity-70">Clean white background with subtle shadow</p>
          </WellnessCard>
          <WellnessCard gradient="coral" hover>
            <h3 className="font-medium mb-2">Coral Gradient (Hover)</h3>
            <p className="text-sm opacity-70">Warm coral gradient with hover effect</p>
          </WellnessCard>
          <WellnessCard gradient="lavender" hover>
            <h3 className="font-medium mb-2">Lavender Gradient</h3>
            <p className="text-sm opacity-70">Calming lavender gradient</p>
          </WellnessCard>
          <WellnessCard gradient="blue" hover>
            <h3 className="font-medium mb-2">Blue Gradient</h3>
            <p className="text-sm opacity-70">Trustworthy blue gradient</p>
          </WellnessCard>
        </div>
      </section>

      {/* Card Stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Card Stack</h2>
        <p className="text-sm opacity-70 mb-4">Swipeable card stack with drag interactions and gradient backgrounds</p>
        <WellnessCard>
          <div className="space-y-6">
            <div className="flex justify-center py-8">
              <CardStack
                items={[
                  {
                    id: 1,
                    title: "Morning Meditation",
                    description: "Start your day with peace and mindfulness",
                    gradient: "coral",
                    tag: "Meditation"
                  },
                  {
                    id: 2,
                    title: "Evening Reflection",
                    description: "Wind down and reflect on your day",
                    gradient: "lavender",
                    tag: "Reflection"
                  },
                  {
                    id: 3,
                    title: "Breathing Exercise",
                    description: "Calm your mind with deep breaths",
                    gradient: "blue",
                    tag: "Breathing"
                  },
                  {
                    id: 4,
                    title: "Mindful Walk",
                    description: "Connect with nature and find clarity",
                    gradient: "pink",
                    tag: "Exercise"
                  },
                  {
                    id: 5,
                    title: "Gratitude Practice",
                    description: "Acknowledge what brings you joy today",
                    gradient: "coral",
                    tag: "Gratitude"
                  },
                ]}
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-xs opacity-50 mb-2">Features:</p>
              <ul className="text-xs opacity-70 space-y-1 list-disc list-inside">
                <li>Drag and swipe to navigate cards</li>
                <li>Spring animations for smooth interactions</li>
                <li>Customizable gradient backgrounds</li>
                <li>Support for images or gradient cards</li>
                <li>Configurable animation settings</li>
              </ul>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Stat Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Stat Cards</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard label="Stress Level" value="48" unit="%" gradient="blue" />
          <StatCard label="Sleep Quality" value="5h" gradient="pink" />
          <StatCard label="Mood Score" value="7.2" gradient="lavender" />
          <StatCard label="Activity" value="85" unit="%" gradient="coral" />
        </div>
      </section>

      {/* Form Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Form Components</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs opacity-50">Input Fields</p>
              <Input label="Full Name" placeholder="Enter your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Email" placeholder="Enter your email" type="email" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Search" placeholder="Search..." icon={<Search className="w-4 h-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Text Area</p>
              <TextArea 
                label="Message" 
                placeholder="Write your thoughts..." 
                rows={4}
                maxLength={200}
                showCount
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Checkboxes</p>
              <Checkbox label="Enable notifications" checked={notifications} defaultChecked={undefined} onChange={(e) => setNotifications(e.target.checked)} />
              <Checkbox label="Subscribe to newsletter" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
              <Checkbox label="Accept terms and conditions" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Radio Buttons</p>
              <RadioGroup 
                name="mood"
                options={[
                  { value: 'great', label: 'Feeling Great', description: 'Energetic and positive' },
                  { value: 'good', label: 'Feeling Good', description: 'Calm and content' },
                  { value: 'okay', label: 'Feeling Okay', description: 'Neutral mood' },
                  { value: 'low', label: 'Feeling Low', description: 'Need some support' },
                ]}
                value={selectedMood}
                onChange={(value) => setSelectedMood(value)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Toggle Switches</p>
              <div className="flex flex-col gap-3">
                <Toggle label="Daily reminders" size="sm" defaultChecked />
                <Toggle label="Dark mode" size="md" />
                <Toggle label="Public profile" size="lg" />
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Feedback Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Feedback Components</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs opacity-50">Progress Bars</p>
              <ProgressBar value={25} gradient="coral" label="Daily Goal" showLabel />
              <ProgressBar value={60} gradient="lavender" label="Weekly Progress" showLabel />
              <ProgressBar value={90} gradient="blue" label="Monthly Target" showLabel />
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Loading Spinners</p>
              <div className="flex gap-6 items-center">
                <LoadingSpinner size="sm" gradient="coral" />
                <LoadingSpinner size="md" gradient="lavender" />
                <LoadingSpinner size="lg" gradient="blue" />
                <LoadingSpinner size="xl" gradient="pink" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs opacity-50">Alerts</p>
              <Alert variant="success" message="Your meditation session was saved successfully!" />
              <Alert variant="info" title="Daily Reminder" message="Don't forget to log your mood today" />
              <Alert variant="warning" message="You haven't checked in for 3 days" />
              <Alert variant="error" message="Unable to sync your data. Please try again." />
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Data Display */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Data Display</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <WellnessCard>
            <p className="text-xs opacity-50 mb-4">Timeline</p>
            <Timeline 
              items={[
                { time: '09:00 AM', title: 'Morning Meditation', description: '10 minutes of mindfulness', gradient: 'lavender', icon: <Heart className="w-4 h-4 text-white" /> },
                { time: '12:30 PM', title: 'Mood Check-in', description: 'Feeling great today!', gradient: 'coral', icon: <Smile className="w-4 h-4 text-white" /> },
                { time: '03:00 PM', title: 'Breathing Exercise', description: '5 minutes deep breathing', gradient: 'blue', icon: <CheckCircle className="w-4 h-4 text-white" /> },
                { time: '09:00 PM', title: 'Evening Journal', description: 'Reflected on the day', gradient: 'pink', icon: <Calendar className="w-4 h-4 text-white" /> },
              ]}
            />
          </WellnessCard>
          <WellnessCard>
            <div className="space-y-6">
              <div>
                <p className="text-xs opacity-50 mb-4">Avatars</p>
                <div className="flex items-center gap-4">
                  <Avatar fallback="Sarah Chen" gradient="coral" size="xs" />
                  <Avatar fallback="Mike Johnson" gradient="lavender" size="sm" status="online" />
                  <Avatar fallback="Emily Davis" gradient="blue" size="md" status="busy" />
                  <Avatar fallback="Alex Kim" gradient="pink" size="lg" status="offline" />
                </div>
              </div>
              <div>
                <p className="text-xs opacity-50 mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  <Tag label="Meditation" gradient="lavender" />
                  <Tag label="Exercise" gradient="coral" onRemove={() => setTags(tags.filter(tag => tag !== 'Exercise'))} />
                  <Tag label="Journaling" gradient="blue" />
                  <Tag label="Mindfulness" gradient="pink" onRemove={() => setTags(tags.filter(tag => tag !== 'Mindfulness'))} />
                  <Tag label="Sleep" gradient="gray" />
                </div>
              </div>
            </div>
          </WellnessCard>
        </div>
      </section>

      {/* Navigation Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Navigation Components</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs opacity-50 mb-4">Tabs (Pills Style)</p>
              <Tabs 
                variant="pills"
                tabs={[
                  { 
                    id: 'overview', 
                    label: 'Overview',
                    icon: <Activity className="w-4 h-4" />,
                    content: <div className="p-4 bg-gradient-to-r from-[#ff8a65]/10 to-transparent rounded-xl">Overview content with your daily summary and insights</div>
                  },
                  { 
                    id: 'analytics', 
                    label: 'Analytics',
                    icon: <Calendar className="w-4 h-4" />,
                    content: <div className="p-4 bg-gradient-to-r from-[#b8a0d6]/10 to-transparent rounded-xl">Analytics showing your progress over time</div>
                  },
                  { 
                    id: 'settings', 
                    label: 'Settings',
                    content: <div className="p-4 bg-gradient-to-r from-[#a8d8ea]/10 to-transparent rounded-xl">Customize your preferences and notifications</div>
                  },
                ]}
              />
            </div>
            <div>
              <p className="text-xs opacity-50 mb-4">Tabs (Underline Style)</p>
              <Tabs 
                variant="underline"
                tabs={[
                  { id: 'daily', label: 'Daily', content: <p className="text-sm opacity-70 mt-4">Your daily activities and mood tracking</p> },
                  { id: 'weekly', label: 'Weekly', content: <p className="text-sm opacity-70 mt-4">Weekly summary and patterns</p> },
                  { id: 'monthly', label: 'Monthly', content: <p className="text-sm opacity-70 mt-4">Monthly overview and achievements</p> },
                ]}
              />
            </div>
            <div>
              <p className="text-xs opacity-50 mb-4">Breadcrumbs</p>
              <Breadcrumbs 
                items={[
                  { label: 'Home', onClick: () => {} },
                  { label: 'Wellness Dashboard', onClick: () => {} },
                  { label: 'Mood Tracking', onClick: () => {} },
                  { label: 'Current Session' },
                ]}
              />
            </div>
            <div>
              <p className="text-xs opacity-50 mb-4">Pagination</p>
              <Pagination 
                currentPage={currentPage}
                totalPages={12}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Interactive Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Interactive Components</h2>
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs opacity-50 mb-4">Emoji Selector</p>
              <EmojiSelector options={emojiOptions} defaultValue="good" />
            </div>
            <div>
              <p className="text-xs opacity-50 mb-4">Dropdown Selector</p>
              <div className="flex gap-4">
                <DropdownSelector options={['Weeks', 'Months', 'Year']} defaultValue="Weeks" />
                <DropdownSelector options={['Daily', 'Weekly', 'Monthly']} defaultValue="Daily" />
              </div>
            </div>
            <div>
              <p className="text-xs opacity-50 mb-4">Tooltip</p>
              <div className="flex gap-4">
                <Tooltip content="This helps track your daily mood" position="top">
                  <PillButton variant="outline" size="sm">Hover for Top Tooltip</PillButton>
                </Tooltip>
                <Tooltip content="View your weekly progress here" position="bottom">
                  <PillButton variant="outline" size="sm">Hover for Bottom Tooltip</PillButton>
                </Tooltip>
                <Tooltip content="Your personal insights" position="right">
                  <PillButton variant="outline" size="sm">Hover for Right Tooltip</PillButton>
                </Tooltip>
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Chart */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Charts</h2>
        <WellnessCard>
          <p className="text-xs opacity-50 mb-4">Mood Chart</p>
          <MoodChart data={mockMoodData} />
        </WellnessCard>
      </section>

      {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Badges</h2>
        <WellnessCard>
          <div className="flex flex-wrap gap-4">
            <StreakBadge days={3} />
            <StreakBadge days={10} />
            <StreakBadge days={30} />
            <InfoBadge icon={<Smile className="w-4 h-4" />} text="3.6 average mood" />
            <InfoBadge icon={<Clock className="w-4 h-4" />} text="7-8 hours" />
          </div>
        </WellnessCard>
      </section>

      {/* Slider */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Vertical Slider</h2>
        <WellnessCard>
          <div className="flex justify-center py-8">
            <VerticalSlider
              min={0}
              max={8}
              defaultValue={5}
              labels={[
                { value: 8, label: 'Very Well' },
                { value: 6, label: 'Good' },
                { value: 4, label: 'Fair' },
                { value: 2, label: 'Poor' },
              ]}
              color="#ff8a65"
            />
          </div>
        </WellnessCard>
      </section>

      {/* Question & Action Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Question & Action Cards</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <QuestionCard 
            question="What are three things you're grateful for today?"
            buttonText="Reflect"
            gradient="peach"
            onButtonClick={() => setQuestionAnswered('grateful')}
          />
          <QuestionCard 
            question="How did you take care of yourself this week?"
            buttonText="Journal"
            gradient="lavender"
            onButtonClick={() => setQuestionAnswered('selfcare')}
          />
          <ActionCard
            title="5-Minute Breathing"
            description="Quick breathing exercise to reduce stress"
            buttonText="Start"
            gradient="peach"
            icon={<Activity className="w-5 h-5" />}
            onButtonClick={() => setActionStarted('breathing')}
          />
          <ActionCard
            title="Mindful Meditation"
            description="Guided meditation for inner peace"
            buttonText="Begin"
            gradient="lavender"
            icon={<Heart className="w-5 h-5" />}
            onButtonClick={() => setActionStarted('meditation')}
          />
        </div>
      </section>

      {/* Decorative Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">Decorative Components</h2>
        
        {/* Gradient Mesh */}
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs opacity-50 mb-2">Gradient Mesh</p>
              <p className="text-sm opacity-70 mb-6">
                Декоративные градиентные круги в стиле "Light Mesh Holographic Gradients". Поддерживают анимацию, пульсацию и вращение.
              </p>
              <div className="flex flex-wrap items-center gap-8 justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={150} variant="iridescent" animated />
                  <p className="text-xs opacity-50">Iridescent (Animated)</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={150} variant="peachLavender" />
                  <p className="text-xs opacity-50">Peach Lavender</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={150} variant="mintSky" />
                  <p className="text-xs opacity-50">Mint Sky</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={150} variant="roseYellow" />
                  <p className="text-xs opacity-50">Rose Yellow</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={150} variant="coralBlue" />
                  <p className="text-xs opacity-50">Coral Blue</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Варианты с анимацией</p>
              <div className="flex flex-wrap items-center gap-8 justify-center py-4">
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={120} variant="iridescent" pulsing animated />
                  <p className="text-xs opacity-50">Pulsing</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={120} variant="iridescent" rotating animated />
                  <p className="text-xs opacity-50">Rotating</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <GradientMesh size={120} variant="iridescent" pulsing rotating animated animationSpeed={1.5} />
                  <p className="text-xs opacity-50">Pulsing + Rotating</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Различные размеры</p>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <GradientMesh size={80} variant="peachLavender" />
                <GradientMesh size={120} variant="mintSky" />
                <GradientMesh size={160} variant="roseYellow" />
                <GradientMesh size={100} variant="coralBlue" />
                <GradientMesh size={200} variant="iridescent" animated opacity={0.8} />
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Кастомные цвета</p>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <GradientMesh 
                  size={130} 
                  variant="custom" 
                  colors={['#FF6B9D', '#C44569', '#F8B500']} 
                  animated 
                />
                <GradientMesh 
                  size={130} 
                  variant="custom" 
                  colors={['#A8E6CF', '#FFD3B6', '#FFAAA5']} 
                  pulsing 
                  animated 
                />
                <GradientMesh 
                  size={130} 
                  variant="custom" 
                  colors={['#B8B5FF', '#7868E6', '#EDEEF7']} 
                  rotating 
                  animated 
                />
              </div>
            </div>
          </div>
        </WellnessCard>

        {/* Decorative Shader Circle */}
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs opacity-50 mb-4">Decorative Shader Circle</p>
              <p className="text-sm opacity-70 mb-6">
                Анимированные декоративные круги с WebGL шейдерами. Поддерживают различные визуальные эффекты и интерактивность.
              </p>
              <div className="flex flex-wrap items-center gap-8 justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <DecorativeShaderCircle size={150} />
                  <p className="text-xs opacity-50">Default: Iridescent</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DecorativeShaderCircle size={150} shaderId={1} />
                  <p className="text-xs opacity-50">Shader 1: Gradient Wave</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DecorativeShaderCircle size={150} shaderId={2} />
                  <p className="text-xs opacity-50">Shader 2: Spiral</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DecorativeShaderCircle size={150} shaderId={3} />
                  <p className="text-xs opacity-50">Shader 3: Pulsing Rings</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <DecorativeShaderCircle size={150} shaderId={4} />
                  <p className="text-xs opacity-50">Shader 4: Swirling Colors</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Различные размеры</p>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <DecorativeShaderCircle size={100} shaderId={1} />
                <DecorativeShaderCircle size={150} shaderId={2} />
                <DecorativeShaderCircle size={200} shaderId={3} />
                <DecorativeShaderCircle size={120} shaderId={4} />
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Без эффектов при наведении</p>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <DecorativeShaderCircle size={120} shaderId={1} enableHoverEffect={false} />
                <DecorativeShaderCircle size={120} shaderId={2} enableHoverEffect={false} />
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-xs opacity-50 mb-4">Без взаимодействия с мышью</p>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <DecorativeShaderCircle size={120} shaderId={3} enableMouseInteraction={false} />
                <DecorativeShaderCircle size={120} shaderId={4} enableMouseInteraction={false} />
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

    </div>
  );
}