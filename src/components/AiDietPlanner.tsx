import React, { useState } from 'react';
import { Flame, Sparkles, Scale, Coffee, Shield, Check, Heart, Droplets } from 'lucide-react';

interface AiDietPlannerProps {
  geminiApiKey?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function AiDietPlanner({ geminiApiKey, addToast, addXp }: AiDietPlannerProps) {
  const [goal, setGoal] = useState<'Muscle Gain' | 'Fat Loss' | 'Weight Gain' | 'Maintenance'>('Muscle Gain');
  const [restriction, setRestriction] = useState<'Vegetarian' | 'Non-Vegetarian'>('Vegetarian');
  const [loading, setLoading] = useState(false);
  const [diet, setDiet] = useState<any>({
    breakfast: "Oats with sliced almonds, 1 chopped banana, and dynamic whey scoop mixed with milk (or warm high-protein pea milk).",
    lunch: "Double cup brown rice, black bean & sprout salad, tofu stir-fry, and seasoned fresh broccoli.",
    dinner: "Quinoa loaded with steamed soy nuggets, chickpea chili, roasted almonds, and light avocado dressing.",
    preWorkout: "1 shot high-caffeine black coffee with 2 whole dates or 1 banana.",
    postWorkout: "Clean whey soy isolate protein mixed shake or heavy green bean sprouts with paneer cubes.",
    calories: 2750,
    protein: 145,
    carbs: 310,
    fats: 65,
    waterIntake: 3800
  });

  const generateDiet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-diet-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietGoal: goal,
          restriction,
          geminiApiKey
        })
      });
      const data = await res.json();
      setDiet(data.dietResult);
      addToast(`Optimized ${goal} Diet plan synthesized successfully!`, 'success');
      addXp(120, 'Generated Elite Nutrition Diet Blueprint');
    } catch (err: any) {
      addToast('Online AI diet generation failed. Loaded deterministic master diet.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">AI Combat Nutrition Planner</h2>
        </div>
        <span className="text-[10px] bg-red-650/10 text-red-400 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
          Gemini 3.5 Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goal SELECT */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Discipline Goal</label>
          <select
            value={goal}
            onChange={(e: any) => setGoal(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="Muscle Gain">💪 Muscle Gain (Lean Bulking)</option>
            <option value="Fat Loss">⚡ Fat Loss (Shedding Cut)</option>
            <option value="Weight Gain">🔥 Weight Gain (Heavy Aggressive)</option>
            <option value="Maintenance">🛡 Maintenance (Performance Baseline)</option>
          </select>
        </div>

        {/* Dietary style SELECT */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Dietary Style</label>
          <select
            value={restriction}
            onChange={(e: any) => setRestriction(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="Vegetarian">🌿 Vegetarian (Plant Domiciled)</option>
            <option value="Non-Vegetarian">🍗 Non-Vegetarian (Animal Proteins)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generateDiet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-650 to-amber-600 text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Loading Diet Matrix...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Synthesize AI Diet Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diet Plan Output Displays */}
      <div className="bg-zinc-950/65 rounded-2xl border border-zinc-900 overflow-hidden">
        
        {/* Macronutrient Counter Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-0.5 bg-zinc-900 border-b border-zinc-900">
          <div className="bg-zinc-950 p-4 text-center">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Calories</span>
            <p className="text-xl font-mono font-black text-white mt-1">{diet.calories} kcal</p>
          </div>
          <div className="bg-zinc-950 p-4 text-center">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Proteins</span>
            <p className="text-xl font-mono font-black text-rose-500 mt-1">{diet.protein}g</p>
          </div>
          <div className="bg-zinc-950 p-4 text-center">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Carbohydrates</span>
            <p className="text-xl font-mono font-black text-indigo-400 mt-1">{diet.carbs}g</p>
          </div>
          <div className="bg-zinc-950 p-4 text-center">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Fats</span>
            <p className="text-xl font-mono font-black text-amber-500 mt-1">{diet.fats}g</p>
          </div>
          <div className="bg-zinc-950 p-4 text-center col-span-2 sm:col-span-1 border-t sm:border-t-0 border-zinc-900">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">Water Intake</span>
            <p className="text-xl font-mono font-black text-teal-400 mt-1">{(diet.waterIntake / 1000).toFixed(1)}L</p>
          </div>
        </div>

        {/* Meal timeline descriptions */}
        <div className="p-5 space-y-4 font-sans divide-y divide-zinc-900 text-xs">
          
          <div className="pt-0 flex flex-col sm:flex-row gap-2.5 sm:gap-6">
            <span className="w-24 shrink-0 font-mono font-black uppercase text-red-500 text-[10px] tracking-wider mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Breakfast
            </span>
            <p className="text-zinc-350 leading-relaxed text-left">{diet.breakfast}</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-6">
            <span className="w-24 shrink-0 font-mono font-black uppercase text-amber-500 text-[10px] tracking-wider mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Lunch
            </span>
            <p className="text-zinc-350 leading-relaxed text-left">{diet.lunch}</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-6">
            <span className="w-24 shrink-0 font-mono font-black uppercase text-purple-500 text-[10px] tracking-wider mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Pre Workout
            </span>
            <p className="text-zinc-350 leading-relaxed text-left">{diet.preWorkout}</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-6">
            <span className="w-24 shrink-0 font-mono font-black uppercase text-emerald-500 text-[10px] tracking-wider mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Post Workout
            </span>
            <p className="text-zinc-350 leading-relaxed text-left">{diet.postWorkout}</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-6">
            <span className="w-24 shrink-0 font-mono font-black uppercase text-blue-500 text-[10px] tracking-wider mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Dinner
            </span>
            <p className="text-zinc-350 leading-relaxed text-left">{diet.dinner}</p>
          </div>

        </div>

      </div>

      {/* Military/Clinical Advice Note */}
      <div className="flex items-start gap-2.5 bg-zinc-955 p-3 rounded-xl border border-zinc-900">
        <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-zinc-500 uppercase font-bold tracking-wider font-mono">
          Diet compliance is 90% of muscle retention and cognitive focus. Skip fast food to clear biological liver stress for NEET study sprints.
        </p>
      </div>

    </div>
  );
}
