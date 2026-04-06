@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 25% 97%;
    --foreground: 210 60% 10%;

    --card: 0 0% 100%;
    --card-foreground: 210 60% 10%;

    --popover: 0 0% 100%;
    --popover-foreground: 210 60% 10%;

    --primary: 210 60% 12%;
    --primary-foreground: 0 0% 100%;

    --secondary: 190 30% 92%;
    --secondary-foreground: 210 60% 12%;

    --muted: 210 20% 94%;
    --muted-foreground: 210 20% 50%;

    --accent: 190 100% 39%;
    --accent-foreground: 210 60% 10%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --border: 210 20% 88%;
    --input: 210 20% 88%;
    --ring: 190 100% 39%;

    --radius: 0.75rem;

    /* BWT Brand tokens */
    --bwt-navy: 210 60% 12%;
    --bwt-teal: 190 100% 39%;
    --bwt-teal-dark: 190 100% 28%;
    --bwt-teal-light: 190 60% 92%;
    --bwt-white: 0 0% 100%;

    font-family: "Inter", sans-serif;
  }

  .dark {
    --background: 210 50% 8%;
    --foreground: 210 20% 95%;
    --card: 210 45% 12%;
    --card-foreground: 210 20% 95%;
    --popover: 210 45% 12%;
    --popover-foreground: 210 20% 95%;
    --primary: 190 100% 39%;
    --primary-foreground: 210 60% 8%;
    --secondary: 210 35% 18%;
    --secondary-foreground: 210 20% 95%;
    --muted: 210 30% 16%;
    --muted-foreground: 210 15% 55%;
    --accent: 190 100% 39%;
    --accent-foreground: 210 60% 8%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 210 40% 98%;
    --border: 210 30% 20%;
    --input: 210 30% 20%;
    --ring: 190 100% 39%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
  h1,
  h2,
  h3 {
    font-family: "Barlow Condensed", sans-serif;
    font-weight: 700;
  }
}

@layer utilities {
  .font-display {
    font-family: "Barlow Condensed", sans-serif;
  }
  .glass-card {
    @apply bg-card/90 backdrop-blur-md border border-border/50 shadow-sm;
  }
  .bwt-gradient {
    background: linear-gradient(135deg, #0d1b2a 0%, #0d3a4a 100%);
  }
}
