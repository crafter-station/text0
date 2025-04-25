'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { StarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { T0Logo } from "@/components/ui/icons/t0-logo";
import { GithubIcon } from "@/components/ui/icons/github";
import { XIcon } from "@/components/ui/icons/x-icon";

const LOCAL_STORAGE_KEY = "text0-github-modal-shown";

export function PleaseStarUsOnGitHub() {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [open, setOpen] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const hasShown = localStorage.getItem(LOCAL_STORAGE_KEY);
    setShouldShow(!hasShown);
  }, []);

  const handleClose = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    setOpen(false);
    setShouldShow(false);
  };

  const handleStarClick = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    setOpen(false);
    setShouldShow(false);
  };

  if (!shouldShow) return null;

  const StarButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="group relative flex items-center gap-2 pr-4 transition-all hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={isHovered ? {
            scale: 1.2,
            rotate: 360,
          } : {
            scale: 1,
            rotate: 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <StarIcon className="size-4 fill-amber-500 dark:fill-amber-400 text-amber-600 dark:text-amber-500" />
        </motion.div>
      </div>
      <motion.span
        animate={isHovered ? {
          scale: 1.05,
        } : {
          scale: 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-xs font-medium"
      >
        Star on GitHub
      </motion.span>
      <motion.div
        animate={isHovered ? {
          scale: 1.1,
          rotate: [0, -10, 10, 0],
        } : {
          scale: 1,
          rotate: 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <GithubIcon className="size-3 opacity-50 transition-opacity group-hover:opacity-100" />
      </motion.div>
    </Button>
  );

  const ModalContent = () => (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-6 p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="rounded-lg bg-foreground p-3 shadow-lg">
              <T0Logo className="h-8 w-8 text-primary dark:text-primary" />
            </div>
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                repeatDelay: 0.5,
              }}
              className="absolute -top-5 -right-5 z-10"
            >
              <motion.div
                initial={{ opacity: 1 }}
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  repeatDelay: 0.5,
                }}
              >
                <StarIcon className="size-6 fill-amber-500 stroke-[1.5] dark:fill-amber-400 text-amber-600 dark:text-amber-500" />
              </motion.div>
            </motion.div>
          </div>
          <div className="space-y-2">
            <h3 className="bg-gradient-to-r dark:brightness-150 from-primary/90 via-primary to-primary/90 bg-clip-text text-xl font-semibold text-transparent dark:from-primary/80 dark:via-primary dark:to-primary/80">
              Support Text0's Journey
            </h3>
            <p className="text-sm text-muted-foreground">
              Your star helps us reach more developers and fuels our open-source mission
            </p>
          </div>
        </div>

        <motion.a
          href="https://github.com/crafter-station/text0"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleStarClick}
          className="block w-fit"
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
        >
          <motion.div
            animate={buttonHovered ? {
              scale: 1.02,
            } : {
              scale: 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="dark:brightness-120"
            >
              <motion.div
                animate={buttonHovered ? {
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.2, 1.2, 1.2, 1],
                } : {
                  rotate: 0,
                  scale: 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <StarIcon className="size-4" />
              </motion.div>
              <motion.span
                animate={buttonHovered ? {
                  scale: 1.05,
                } : {
                  scale: 1,
                }}
                transition={{ duration: 0.5 }}
              >
                Star on GitHub
              </motion.span>
              <GithubIcon className="size-4" />
            </Button>
          </motion.div>
        </motion.a>
      </div>

      <div className="relative mt-2 border-t border-border/40 bg-muted/40 px-6 py-3 backdrop-blur-sm">
        <div className="flex w-full flex justify-between items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://github.com/Railly"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Railly
            </a>{" "}
            &{" "}
            <a
              href="https://cueva.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Anthony
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/crafter-station/text0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <GithubIcon className="size-3.5" />
            </a>
            <a
              href="https://twitter.com/raillyhugo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <div className="fixed sr-only bottom-4 right-4 z-50">
            Open Modal
          </div>
        </DialogTrigger>
        <DialogContent title="Star Text0" className="p-0 gap-0">
          <ModalContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerTitle className="sr-only">Star Text0</DrawerTitle>
      <DrawerTrigger asChild>
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <StarButton />
          </motion.div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="p-0 pb-20">
        <ModalContent />
      </DrawerContent>
    </Drawer>
  );
} 