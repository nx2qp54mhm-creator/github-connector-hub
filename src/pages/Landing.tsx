import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CreditCard, Car, Home, Plane, Smartphone, ChevronRight, Check } from "lucide-react";
import policyPocketLogo from "@/assets/policy-pocket-logo.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }
};
const features = [{
  icon: Shield,
  title: "All Your Coverage, Organized",
  description: "Insurance policies, credit card benefits, warranties—everything in one place, organized by what's actually covered, not which company it came from."
}, {
  icon: CreditCard,
  title: "Instant Answers When You Need Them",
  description: "\"Am I covered for this rental?\" \"What protection do I have for this purchase?\" Ask in plain English, get clear answers from all your policies at once."
}, {
  icon: Smartphone,
  title: "Discover Protection You're Already Paying For",
  description: "Most people don't know their credit cards include rental car coverage, purchase protection, and travel insurance. We surface benefits buried in fine print."
}];
const coverageTypes = [{
  icon: Plane,
  label: "Travel Protection"
}, {
  icon: CreditCard,
  label: "Purchase Coverage"
}, {
  icon: Car,
  label: "Auto Insurance"
}, {
  icon: Home,
  label: "Home/Renters"
}, {
  icon: Smartphone,
  label: "Device Protection"
}];
const benefits = ["Track all your insurance policies in one place", "Discover credit card benefits you never knew you had", "Never miss a claim opportunity again", "Compare coverage across multiple sources", "Get personalized coverage recommendations"];
export default function Landing() {
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={policyPocketLogo} alt="Policy Pocket logo" className="h-10 w-10 object-contain rounded-lg" />
              <span className="font-display text-xl font-bold text-foreground">Policy Pocket</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div className="space-y-4" variants={fadeInUp}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  All Your Policies,{" "}
                  <span className="text-primary">in One Place</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl">Stop juggling insurance policies and hidden credit card benefits. Policy Pocket brings everything together so you can see what you're protected against and where you need coverage.</p>
              </motion.div>

              <motion.div className="flex flex-wrap gap-2" variants={fadeInUp}>
                {coverageTypes.map((type, index) => (
                  <motion.div 
                    key={type.label} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-full text-xs text-muted-foreground"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  >
                    <type.icon className="h-3.5 w-3.5 text-primary" />
                    {type.label}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div className="pt-2" variants={fadeInUp}>
                <Link to="/auth">
                  <Button size="lg" className="shadow-primary-glow">
                    Get Started Free
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <Card className="relative shadow-elegant border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Coverage Dashboard</p>
                      <p className="text-sm text-muted-foreground">Your protection at a glance</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[{
                    label: "Travel Insurance",
                    status: "Active",
                    source: "Chase Sapphire"
                  }, {
                    label: "Auto Insurance",
                    status: "Expires Soon",
                    source: "GEICO"
                  }, {
                    label: "Cell Phone Protection",
                    status: "Active",
                    source: "Visa Signature"
                  }].map((item, index) => (
                    <motion.div 
                      key={item.label} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.15 }}
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.source}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.status === "Active" ? "bg-success-light text-success-foreground" : "bg-warning-light text-warning-foreground"}`}>
                        {item.status}
                      </span>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Coverage Intelligence System
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Policy Pocket helps you understand, organize, and maximize all the protection you already have.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                custom={index}
              >
                <Card className="border-border/50 hover:shadow-elegant transition-shadow h-full">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-foreground"
                variants={fadeInUp}
              >
                Stop Leaving Money on the Table
              </motion.h2>
              <motion.p 
                className="text-lg text-muted-foreground"
                variants={fadeInUp}
              >
                Most people have valuable coverage they never use because they simply don't know about it.
                Policy Pocket changes that.
              </motion.p>
              <motion.ul className="space-y-4" variants={fadeInUp}>
                {benefits.map((benefit, index) => (
                  <motion.li 
                    key={benefit} 
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-success-light flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-success-foreground" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <motion.div 
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            variants={fadeInUp}
          >
            Ready to Get Organized?
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground mb-8"
            variants={fadeInUp}
          >
            Join Policy Pocket today and start understanding your coverage in minutes.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link to="/auth">
              <Button size="lg" className="shadow-primary-glow">
                Get Started Free
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={policyPocketLogo} alt="Policy Pocket logo" className="h-8 w-8 object-contain rounded-lg" />
              <span className="text-sm text-muted-foreground">© 2025 Policy Pocket. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}