'use client';

import React, { useEffect, useRef } from 'react';
import { VoiceState } from '@/types';

interface AvatarCanvasProps {
    state: VoiceState;
    className?: string;
}

const AvatarCanvas: React.FC<AvatarCanvasProps> = ({ state, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const mouthOpennessRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Avatar colors
    const colors = {
        skin: '#F5D0C5',
        hair: '#2D3748',
        eyes: '#1A202C',
        mouth: '#E53E3E',
        shirt: '#B91C1C',
        background: 'transparent',
        glow: {
            idle: 'rgba(185, 28, 28, 0.3)',
            standby: 'rgba(56, 189, 248, 0.4)',
            listening: 'rgba(34, 197, 94, 0.5)',
            processing: 'rgba(234, 179, 8, 0.5)',
            speaking: 'rgba(244, 63, 94, 0.5)',
        },
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawAvatar = () => {
            const time = timeRef.current;
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw glow effect based on state
            const glowColor = colors.glow[state];
            const gradient = ctx.createRadialGradient(
                centerX,
                centerY,
                50,
                centerX,
                centerY,
                200
            );
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Floating animation
            const floatOffset = Math.sin(time * 0.02) * 5;

            // Draw body/shirt
            ctx.beginPath();
            ctx.fillStyle = colors.shirt;
            ctx.ellipse(
                centerX,
                centerY + 120 + floatOffset,
                80,
                50,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw neck
            ctx.beginPath();
            ctx.fillStyle = colors.skin;
            ctx.fillRect(centerX - 20, centerY + 50 + floatOffset, 40, 30);

            // Draw head
            ctx.beginPath();
            ctx.fillStyle = colors.skin;
            ctx.ellipse(
                centerX,
                centerY + floatOffset,
                70,
                80,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw hair
            ctx.beginPath();
            ctx.fillStyle = colors.hair;
            ctx.ellipse(
                centerX,
                centerY - 40 + floatOffset,
                75,
                50,
                0,
                Math.PI,
                Math.PI * 2
            );
            ctx.fill();

            // Side hair
            ctx.beginPath();
            ctx.fillStyle = colors.hair;
            ctx.ellipse(
                centerX - 60,
                centerY - 10 + floatOffset,
                20,
                40,
                -0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = colors.hair;
            ctx.ellipse(
                centerX + 60,
                centerY - 10 + floatOffset,
                20,
                40,
                0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw eyes
            const blinkOffset = Math.sin(time * 0.1) > 0.95 ? 0.1 : 1;

            // Left eye
            ctx.beginPath();
            ctx.fillStyle = '#FFFFFF';
            ctx.ellipse(
                centerX - 25,
                centerY - 10 + floatOffset,
                15,
                20 * blinkOffset,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = colors.eyes;
            ctx.ellipse(
                centerX - 25,
                centerY - 10 + floatOffset,
                8,
                10 * blinkOffset,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.fillStyle = '#FFFFFF';
            ctx.ellipse(
                centerX + 25,
                centerY - 10 + floatOffset,
                15,
                20 * blinkOffset,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = colors.eyes;
            ctx.ellipse(
                centerX + 25,
                centerY - 10 + floatOffset,
                8,
                10 * blinkOffset,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Eye highlights
            ctx.beginPath();
            ctx.fillStyle = '#FFFFFF';
            ctx.arc(centerX - 22, centerY - 14 + floatOffset, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 28, centerY - 14 + floatOffset, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw eyebrows
            ctx.beginPath();
            ctx.strokeStyle = colors.hair;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Left eyebrow
            ctx.moveTo(centerX - 40, centerY - 35 + floatOffset);
            ctx.quadraticCurveTo(
                centerX - 25,
                centerY - 42 + floatOffset,
                centerX - 10,
                centerY - 35 + floatOffset
            );
            ctx.stroke();

            // Right eyebrow
            ctx.beginPath();
            ctx.moveTo(centerX + 10, centerY - 35 + floatOffset);
            ctx.quadraticCurveTo(
                centerX + 25,
                centerY - 42 + floatOffset,
                centerX + 40,
                centerY - 35 + floatOffset
            );
            ctx.stroke();

            // Draw nose
            ctx.beginPath();
            ctx.strokeStyle = '#D69E94';
            ctx.lineWidth = 2;
            ctx.moveTo(centerX, centerY + floatOffset);
            ctx.lineTo(centerX - 5, centerY + 15 + floatOffset);
            ctx.lineTo(centerX + 5, centerY + 15 + floatOffset);
            ctx.stroke();

            // Calculate mouth openness based on state (using ref to avoid re-renders)
            let targetMouth = 0;
            if (state === 'speaking') {
                targetMouth = 0.3 + Math.abs(Math.sin(time * 0.15)) * 0.7;
            } else if (state === 'listening') {
                targetMouth = 0.1;
            } else if (state === 'standby') {
                targetMouth = 0.05;
            }

            // Smooth mouth animation using ref
            mouthOpennessRef.current += (targetMouth - mouthOpennessRef.current) * 0.1;
            const mouthOpenness = mouthOpennessRef.current;

            // Draw mouth
            ctx.beginPath();
            if (mouthOpenness > 0.2) {
                // Open mouth
                ctx.fillStyle = '#8B0000';
                ctx.ellipse(
                    centerX,
                    centerY + 35 + floatOffset,
                    20,
                    10 + mouthOpenness * 15,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                // Teeth
                ctx.beginPath();
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(
                    centerX - 15,
                    centerY + 28 + floatOffset,
                    30,
                    8
                );

                // Tongue
                ctx.beginPath();
                ctx.fillStyle = '#E57373';
                ctx.ellipse(
                    centerX,
                    centerY + 42 + floatOffset,
                    12,
                    6 + mouthOpenness * 5,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                // Closed/smiling mouth
                ctx.strokeStyle = colors.mouth;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(centerX - 20, centerY + 35 + floatOffset);
                ctx.quadraticCurveTo(
                    centerX,
                    centerY + 45 + floatOffset + mouthOpenness * 10,
                    centerX + 20,
                    centerY + 35 + floatOffset
                );
                ctx.stroke();
            }

            // Draw cheeks (blush)
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
            ctx.ellipse(
                centerX - 50,
                centerY + 15 + floatOffset,
                15,
                10,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
            ctx.ellipse(
                centerX + 50,
                centerY + 15 + floatOffset,
                15,
                10,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw state indicator ring
            const ringRadius = 180;
            const ringWidth = 4;
            ctx.beginPath();
            ctx.strokeStyle = colors.glow[state].replace('0.3', '0.8').replace('0.5', '0.8');
            ctx.lineWidth = ringWidth;
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -time * 0.5;
            ctx.arc(centerX, centerY + floatOffset, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pulsing dots around the avatar (for speaking/listening/standby states)
            if (state === 'speaking' || state === 'listening' || state === 'standby') {
                const numDots = state === 'standby' ? 4 : 8;
                const speed = state === 'standby' ? 0.01 : 0.02;
                for (let i = 0; i < numDots; i++) {
                    const angle = (i / numDots) * Math.PI * 2 + time * speed;
                    const dotRadius = ringRadius + 20 + Math.sin(time * 0.1 + i) * 10;
                    const x = centerX + Math.cos(angle) * dotRadius;
                    const y = centerY + floatOffset + Math.sin(angle) * dotRadius;
                    const size = state === 'standby' ? 3 + Math.sin(time * 0.05 + i * 0.5) * 1.5 : 4 + Math.sin(time * 0.1 + i * 0.5) * 2;

                    ctx.beginPath();
                    ctx.fillStyle = colors.glow[state].replace('0.3', '0.9').replace('0.5', '0.9').replace('0.4', '0.9');
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            timeRef.current++;
            animationRef.current = requestAnimationFrame(drawAvatar);
        };

        drawAvatar();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [state]);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className={`${className} w-full h-auto max-w-[400px] touch-none`}
            style={{ background: 'transparent' }}
        />
    );
};

export default AvatarCanvas;
