import { RoutineItem, WorkoutDay, NeetTopic, Achievement } from './types';

export const DEFAULT_ROUTINE_ITEMS: RoutineItem[] = [
  { id: '1', name: 'Late Night Study Block', start: '11:00 PM', end: '04:00 AM', isTask: true, category: 'study' },
  { id: '2', name: 'Pre-Gym Preparation', start: '04:00 AM', end: '04:30 AM', isTask: false, category: 'rest' },
  { id: '3', name: 'Hardcore Gym Session', start: '04:30 AM', end: '06:30 AM', isTask: true, category: 'gym' },
  { id: '4', name: 'Post-Gym & Clinic Prep', start: '06:30 AM', end: '07:00 AM', isTask: false, category: 'rest' },
  { id: '5', name: 'Morning Clinic Duty', start: '07:00 AM', end: '09:00 AM', isTask: true, category: 'clinic' },
  { id: '6', name: 'Rapid Target Revision', start: '09:00 AM', end: '09:30 AM', isTask: true, category: 'revision' },
  { id: '7', name: 'Wind-down & Sleep Prep', start: '09:30 AM', end: '10:30 AM', isTask: false, category: 'rest' },
  { id: '8', name: 'Deep Core Sleep', start: '10:30 AM', end: '01:00 PM', isTask: true, category: 'sleep' },
  { id: '9', name: 'Rest, Nutrition & Dinner', start: '01:00 PM', end: '03:00 PM', isTask: false, category: 'rest' },
  { id: '10', name: 'Afternoon Clinic Duty', start: '03:00 PM', end: '05:00 PM', isTask: true, category: 'clinic' },
  { id: '11', name: 'Rest & Mental Decompress / Walking', start: '05:00 PM', end: '11:00 PM', isTask: true, category: 'walking' }
];

export const DEFAULT_WORKOUT_PLANS: WorkoutDay[] = [
  {
    day: 'Monday',
    focus: 'Chest + Triceps',
    exercises: [
      {
        id: 'mon-1',
        name: 'Incline Dumbbell Press',
        targetMuscle: 'Upper Chest & Front Delts',
        sets: '4',
        reps: '10-12',
        restTime: '90s',
        difficulty: 'Intermediate',
        instructions: [
          'Set a bench to a 30 to 45-degree angle.',
          'Sit on the bench and rest dumbbells on your thighs.',
          'Lie back and press the dumbbells up over your chest with your arms locked.',
          'Lower the weights under control until they are level with your upper chest.',
          'Press the dumbbells back to the starting position following a slight arch.'
        ],
        commonMistakes: [
          'Setting the bench angle too steep, shifting tension entirely to the shoulders.',
          'Bouncing the dumbbells off the chest.',
          'Flaring elbows out at a 90-degree angle; keep them tucked at 45 degrees.'
        ],
        benefits: [
          'Focuses load on the clavicular head of the pectoralis major for upper chest thickness.',
          'Improves bilateral symmetry by utilizing independent weights.'
        ]
      },
      {
        id: 'mon-2',
        name: 'Flat Barbell Bench Press',
        targetMuscle: 'Middle Chest, Anterior Delts',
        sets: '4',
        reps: '8-10',
        restTime: '90s',
        difficulty: 'Intermediate',
        instructions: [
          'Lie flat on your back on a bench, eyes directly under the bar.',
          'Grip the bar slightly wider than shoulder-width, wrap your thumbs around.',
          'Unrack the bar and slide it over your mid-chest line.',
          'Inhale and lower the bar under strict control to your sternum/mid-chest.',
          'Push the floor away with your feet, extend your elbows and press back up while exhaling.'
        ],
        commonMistakes: [
          'Lifting feet off the ground, losing full-body stability.',
          'Lowering the bar too high on the chest (near collarbones), stressing shoulders.',
          'Not wrapping thumbs around the bar (suicide grip).'
        ],
        benefits: [
          'The ultimate foundational movement for chest power and mass.',
          'Stimulates prime movers and stabilizer networks effectively.'
        ]
      },
      {
        id: 'mon-3',
        name: 'Triceps Overhead Dumbbell Extension',
        targetMuscle: 'Triceps (Long Head)',
        sets: '3',
        reps: '12',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Sit on a low-backed seat and hold a single heavy dumbbell with both hands.',
          'Raise the dumbbell directly overhead, gripping the inner plate with palms flat facing up.',
          'Keep your upper arms close to your head and perpendicular to the floor.',
          'Inhale, bend your elbows and lower the weight behind your head in a full arc.',
          'Exhale, press the dumbbell back to the peak position by extending your triceps.'
        ],
        commonMistakes: [
          'Allowing elbows to flare widely outward.',
          'Rounding the lower back excessively.',
          'Using momentum instead of controlled extension.'
        ],
        benefits: [
          'Isolates the long head of the triceps, essential for absolute arm thickness.',
          'Provides a deep micro-stretch directly against resistance.'
        ]
      },
      {
        id: 'mon-4',
        name: 'Cable Triceps Pushdowns',
        targetMuscle: 'Triceps (Lateral & Medial Head)',
        sets: '3',
        reps: '15',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Attach a straight bar or rope to a high pulley system.',
          'Grip with palms facing down, elbows bent at 90 degrees tucked adjacent to ribs.',
          'Lean slightly forward and pull your shoulder blades down.',
          'Push the cable attachment downwards until your elbows are completely locked.',
          'Squeeze the triceps at the bottom for one second, then slowly raise back up.'
        ],
        commonMistakes: [
          'Letting the elbows drift forward and away from the body during the eccentric phase.',
          'Shrugging shoulders up to assist weight reduction.',
          'Bending wrists under load.'
        ],
        benefits: [
          'Constant mechanical tension throughout the movement.',
          'Increases elbow joint stability and general pushing capacity.'
        ]
      }
    ]
  },
  {
    day: 'Tuesday',
    focus: 'Back + Biceps',
    exercises: [
      {
        id: 'tue-1',
        name: 'Wide-Grip Lat Pulldown',
        targetMuscle: 'Lats (Latissimus Dorsi)',
        sets: '4',
        reps: '10',
        restTime: '90s',
        difficulty: 'Beginner',
        instructions: [
          'Sit in a pulldown station and adjust knee pad tightly to secure your hips.',
          'Grip the bar with palms facing away, wider than shoulder-width.',
          'Pull your shoulders back and down, then lean back slightly.',
          'Pull the bar down toward your upper chest, leading with your elbows.',
          'Squeeze your shoulder blades, then slowly return original state.'
        ],
        commonMistakes: [
          'Pulling the bar behind the neck, causing massive rotator cuff stress.',
          'Swinging or using lower back momentum to jerk the load.',
          'Not completing full range of motion.'
        ],
        benefits: [
          'Builds upper back width for the V-taper aesthetic.',
          'Strengthens scapular stabilizers.'
        ]
      },
      {
        id: 'tue-2',
        name: 'Bent-Over Barbell Rows',
        targetMuscle: 'Rhomboids, Lats, Mid-Back',
        sets: '4',
        reps: '8',
        restTime: '90s',
        difficulty: 'Advanced',
        instructions: [
          'Hold a barbell with palms facing down, shoulder-width grip.',
          'Hinge forward from your hips with a flat back, knees slightly bent, torso at 45 degrees.',
          'Let the barbell hang straight in front of your shins.',
          'Pull the bar towards your belly button, keeping elbows tight to your sides.',
          'Squeeze the upper back muscles, then lower under control to tension lock.'
        ],
        commonMistakes: [
          'Rounding the lower back (spinal flexion) under load, risking herniation.',
          'Bouncing up and down to heave the barbell up.',
          'Lifting torso fully straight.'
        ],
        benefits: [
          'Builds immense mid-back thickness and posterior chain strength.',
          'Challenges postural core stability under heavy load.'
        ]
      },
      {
        id: 'tue-3',
        name: 'Standing Barbell Bicep Curls',
        targetMuscle: 'Biceps Brachii (Short & Long Head)',
        sets: '4',
        reps: '10',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Stand tall with feet shoulder-width wide, holding a barbell with underhand grip.',
          'Keep your chest up, shoulders rolled back, and elbows pinned close to your obliques.',
          'Squeeze your biceps and curl the bar up toward shoulder heights.',
          'Contract tightly at peak, then slowly lower the bar over 3 seconds.'
        ],
        commonMistakes: [
          'Flaring elbows backward or forward to make the lift easier.',
          'Leaning backward to swing the bar at peak.',
          'Shortening the eccentric range of motion.'
        ],
        benefits: [
          'The premier exercise for bicep mass building.',
          'Enhances forearm and elbow flexion endurance.'
        ]
      },
      {
        id: 'tue-4',
        name: 'Incline Dumbbell Hammer Curls',
        targetMuscle: 'Brachialis, Brachioradialis',
        sets: '3',
        reps: '12',
        restTime: '60s',
        difficulty: 'Intermediate',
        instructions: [
          'Sit on a bench angled at 60 degrees, holding dumbbells in both hands using a neutral/hammer grip.',
          'Let your arms hang straight down behind the shoulder line.',
          'Curl the weights slowly upwards while keeping the palms facing each other throughout routing.',
          'Bring dumbbells to near shoulder level, squeeze, then return under perfect tempo.'
        ],
        commonMistakes: [
          'Swinging weights or shifting elbows forward.',
          'Pronating wrists; keep thumbs straight toward shoulder line.'
        ],
        benefits: [
          'Develops the brachialis which pushes the biceps up, creating a larger overall peak.',
          'Targets key outer forearm musculature.'
        ]
      }
    ]
  },
  {
    day: 'Wednesday',
    focus: 'Shoulders',
    exercises: [
      {
        id: 'wed-1',
        name: 'Overhead Barbell Military Press',
        targetMuscle: 'Anterior & Medial Delts, Triceps',
        sets: '4',
        reps: '8-10',
        restTime: '90s',
        difficulty: 'Advanced',
        instructions: [
          'Set a barbell in a rack at shoulder-height. Grip the bar slightly wider than shoulders.',
          'Unrack bar on your upper chest/clavicular shelf, legs tight, core braced hard.',
          'Press the bar straight upward while pulling your chin slightly back so the bar clears.',
          'Once the bar clears your forehead, push your head forward slightly and lock out elbows.'
        ],
        commonMistakes: [
          'Excessive arching of the lower back (pelvic tilt), risking lumbar compression.',
          'Using a leg drive (convert to push-press) instead of raw upper body force.',
          'Incomplete lockout overhead.'
        ],
        benefits: [
          'Phenomenal foundational shoulder overhead power utility.',
          'Develops exceptional upper-body and core structural strength.'
        ]
      },
      {
        id: 'wed-2',
        name: 'Dumbbell Lateral Raises',
        targetMuscle: 'Lateral Deltoids (Side Delts)',
        sets: '4',
        reps: '15',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Stand tall with dumbbells resting at your side, palms facing together.',
          'Hinge slightly forward (5 degrees) to align lateral delts directly with gravity.',
          'Raise arms outward to the side in a wide arc, slightly leading with your pinkies.',
          'Raise weights until arms are parallel to the floor, then lower under high control.'
        ],
        commonMistakes: [
          'Swinging the weights off the thighs using leg bounce.',
          'Raising hands above the elbows; handles must be level or slightly lower than elbow height.',
          'Shrugging up with the traps to pull load up.'
        ],
        benefits: [
          'Directly isolates the side deltoids to create the desired aesthetic shoulder width.',
          'Extremely safe and effective shoulder stabilizer reinforcement.'
        ]
      },
      {
        id: 'wed-3',
        name: 'Rear Delt Dumbbell Flyes',
        targetMuscle: 'Posterior Deltoids (Rear Delts)',
        sets: '3',
        reps: '12',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Sit on the edge of a bench or stand holding dumbbells.',
          'Hinge forward from the hips until your torso is almost parallel to the floor.',
          'Let dumbbells hang down with palms facing each other, elbows slightly bent.',
          'Raise your arms out to the sides in a reverse hugging motion, squeezing the back shoulders.'
        ],
        commonMistakes: [
          'Using trap muscles to pull shoulder blades together instead of rear deltoids pushing.',
          'Using momentum to throw weight back.',
          'Lifting neck up, stressing cervical spine.'
        ],
        benefits: [
          'Maintains postural shoulder balance of front/rear muscles.',
          'Reduces risk of rotator cuff injuries.'
        ]
      }
    ]
  },
  {
    day: 'Thursday',
    focus: 'Legs',
    exercises: [
      {
        id: 'thu-1',
        name: 'Barbell Back Squats',
        targetMuscle: 'Quadriceps, Glutes, Hamstrings',
        sets: '4',
        reps: '8-10',
        restTime: '120s',
        difficulty: 'Advanced',
        instructions: [
          'Set a barbell in the rack just below shoulder level. Position bar on upper traps.',
          'Squeeze shoulder blades, unrack bar and take 2 steps back. Feet slightly wider than hips.',
          'Take a deep belly breath, brace core tight, and push hips back to lower down.',
          'Squat down until thighs are parallel or below parallel to the floor.',
          'Drive through the mid-foot to stand back up, keeping chest high.'
        ],
        commonMistakes: [
          'Knees caving inward (valgus collapse), creating massive ACL strain.',
          'Heels lifting off the ground, shifting weight to toes.',
          'Butt-wink (lower back rounding at the bottom of the squat).'
        ],
        benefits: [
          'The undisputed king of lower body mass and anabolic hormone stimulation.',
          'Increases total body alignment and structural bone density.'
        ]
      },
      {
        id: 'thu-2',
        name: 'Incline Leg Press',
        targetMuscle: 'Quads, Glutes',
        sets: '3',
        reps: '12',
        restTime: '90s',
        difficulty: 'Beginner',
        instructions: [
          'Sit in a leg press machine and place your feet shoulder-width apart on the sled.',
          'Lower safety locks while pressing sled up. Do not fully hyper-extend knees.',
          'Lower the sled slowly until knees are bent to approximately 90 degrees.',
          'Drive the sled back up under control, concentrating on quad recruitment.'
        ],
        commonMistakes: [
          'Allowing the lower back/tailbone to lift off the padded seat at the bottom.',
          'Locking knees fully out (hyperextending) at peak.',
          'Using too narrow a range of motion.'
        ],
        benefits: [
          'Safely loads lower body without taxing the spine heavily.',
          'Excellent for targeting specific foot placement emphasis.'
        ]
      },
      {
        id: 'thu-3',
        name: 'Lying Leg Curls',
        targetMuscle: 'Hamstrings',
        sets: '3',
        reps: '12',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Lie face down on a leg curl bench, aligning your knees with the machine pivot axis.',
          'Secure padding just below the calf muscles, resting above your ankles.',
          'Squeeze your hamstrings and pull the pad up toward your glutes.',
          'Hold concentration for a moment, then slowly extend legs back to origin.'
        ],
        commonMistakes: [
          'Letting hips rise off the bench to assist pulling.',
          'Swinging weight rapidly without concentric control.'
        ],
        benefits: [
          'Pure isolated hamstring targeting, vital for hamstring to quad ratios.',
          'Strengthens knee flexors and reduces potential hamstring pulls.'
        ]
      }
    ]
  },
  {
    day: 'Friday',
    focus: 'Chest + Back',
    exercises: [
      {
        id: 'fri-1',
        name: 'Flat Barbell Bench Press',
        targetMuscle: 'Chest, Front Deltoids',
        sets: '3',
        reps: '8-10',
        restTime: '90s',
        difficulty: 'Intermediate',
        instructions: [
          'Lie flat on the bench, grip with thumbs around slightly wider than shoulders.',
          'Lower bar carefully to sternum while tucking elbows at 45 degrees.',
          'Drive legs, press barbell straight upward to complete lockout.'
        ],
        commonMistakes: [
          'Bouncing bar of breastbone.',
          'Allowing shoulder blades to un-retract.'
        ],
        benefits: [
          'Builds horizontal push volume directly after rest states.',
          'Increases foundational explosive power.'
        ]
      },
      {
        id: 'fri-2',
        name: 'Incline Dumbbell Flyes',
        targetMuscle: 'Pectoralis Major (Upper Clavicular)',
        sets: '3',
        reps: '12',
        restTime: '90s',
        difficulty: 'Intermediate',
        instructions: [
          'Sit on a 30-degree incline bench with dumbbells held chest height, palms facing in.',
          'Lower weights in a wide, hugging circle until chest feels an optimal stretch.',
          'Contract inner pectorals and return dumbbells to top keeping slight bend in elbows.'
        ],
        commonMistakes: [
          'Converting flyes to presses by bending elbows too much.',
          'Over-stretching beyond normal range of motion.'
        ],
        benefits: [
          'Exceptional stretch overload on upper pectoral fibers.',
          'Low mechanical load on joints compared to presses.'
        ]
      },
      {
        id: 'fri-3',
        name: 'Neutral Grip Cable Rows',
        targetMuscle: 'Lats, Rhomboids, Traps',
        sets: '3',
        reps: '10',
        restTime: '90s',
        difficulty: 'Beginner',
        instructions: [
          'Sit on cable row bench, place feet on pedals and grab the V-bar accessory.',
          'Sit up with flat back, extend arms forward to pre-stretch.',
          'Pull attachment toward lower stomach by sweeping elbows close to obliques.',
          'Retract scapula hard, squeeze for 1 second, and reverse under resistance.'
        ],
        commonMistakes: [
          'Leaning vastly backwards to pull, substituting lower back weight leverage.',
          'Failing to pull back of shoulders.'
        ],
        benefits: [
          'Promotes thicker and deep aesthetic horizontal rows.',
          'Superb upper-body postural builder.'
        ]
      }
    ]
  },
  {
    day: 'Saturday',
    focus: 'Arms',
    exercises: [
      {
        id: 'sat-1',
        name: 'Standing EZ-Bar Curles',
        targetMuscle: 'Biceps Brachii, Forearms',
        sets: '3',
        reps: '10-12',
        restTime: '60s',
        difficulty: 'Beginner',
        instructions: [
          'Hold an EZ-bar on the outer angled curves with an underhand grip.',
          'Roll shoulders back, anchor elbows securely into your waist.',
          'Curl the bar upward toward chest while preserving stiff wrists.',
          'Tense biceps fully at peak, then slow-lower to bottom position.'
        ],
        commonMistakes: [
          'Swinging the hips to initiate lift.',
          'Letting the elbows translate forward over shoulder height.'
        ],
        benefits: [
          'Angled grip reduces stress on wrists and elbows.',
          'Perfect mechanical bicep activation pattern.'
        ]
      },
      {
        id: 'sat-2',
        name: 'Lying Skull Crushers',
        targetMuscle: 'Triceps Brachii',
        sets: '3',
        reps: '10-12',
        restTime: '60s',
        difficulty: 'Intermediate',
        instructions: [
          'Lie flat on bench, holding EZ bar over chest with narrow grip.',
          'Angle upper arms back roughly 10 degrees behind perpendicular to floor.',
          'Keep upper arms strict; bend elbows to lower bar toward your forehead.',
          'Press the bar back using the power of triceps back to initial angle.'
        ],
        commonMistakes: [
          'Allowing upper arm bone (humerus) to wobble forward and back.',
          'Banging bar against forehead.'
        ],
        benefits: [
          'Direct long-head stretch loading across elbow joints.',
          'Exceptional arm development.'
        ]
      }
    ]
  },
  {
    day: 'Sunday',
    focus: 'Rest',
    exercises: [
      {
        id: 'sun-1',
        name: 'Rest and Physical Recovery Day',
        targetMuscle: 'Full Body Central Nervous System',
        sets: '0',
        reps: '0',
        restTime: 'All Day',
        difficulty: 'Beginner',
        instructions: [
          'Give major lifting muscles opportunity to rebuild structural micro-tears.',
          'Focus heavily on static stretching and hydration protocols.',
          'Maintain clean nutrition schedules to maximize metabolic repair.',
          'Complete light general activity such as the 5:00 PM walking routine.'
        ],
        commonMistakes: [
          'Sneaking in hard training sessions under high systemic exhaustion.',
          'Abandoning daily nutrient and hydration tracking targets.'
        ],
        benefits: [
          'Resets CNS adrenal sensitivity for the upcoming Monday chest workout.',
          'Significantly lowers systemic inflammation levels.'
        ]
      }
    ]
  }
];

export const DEFAULT_NEET_TOPICS: NeetTopic[] = [
  // Biology
  { id: 'bio-1', subject: 'Biology', chapter: 'Cell Biology', topicName: 'Mitosis and Meiosis Cycle', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'bio-2', subject: 'Biology', chapter: 'Human Physiology', topicName: 'Cardiovascular Circulation Mechanics', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'bio-3', subject: 'Biology', chapter: 'Genetics', topicName: 'Mendelian Inheritance & Dihybrid Crosses', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'bio-4', subject: 'Biology', chapter: 'Plant Physiology', topicName: 'Photosynthesis Light & Dark Reaction Cycles', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'bio-5', subject: 'Biology', chapter: 'Ecology', topicName: 'Biodiversity Hotspots & Food Web Pyramids', isCompleted: false, isRevised: false, isWeak: false },
  
  // Physics
  { id: 'phy-1', subject: 'Physics', chapter: 'Mechanics', topicName: 'Newton\'s Laws of Motion & Friction Coeffs', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'phy-2', subject: 'Physics', chapter: 'Electrodynamics', topicName: 'Electrostatics Gausses Law & Capacitor Dielectrics', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'phy-3', subject: 'Physics', chapter: 'Wave Optics', topicName: 'Young\'s Double Slit Interference Patterns', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'phy-4', subject: 'Physics', chapter: 'Modern Physics', topicName: 'Photoelectric Wave-Particle Duality Calculations', isCompleted: false, isRevised: false, isWeak: false },
  
  // Chemistry
  { id: 'che-1', subject: 'Chemistry', chapter: 'Organic Chemistry', topicName: 'Nucleophilic Substitution SN1 vs SN2 Mechanisms', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'che-2', subject: 'Chemistry', chapter: 'Physical Chemistry', topicName: 'Chemical Thermodynamics & Gibbs Free Energy', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'che-3', subject: 'Chemistry', chapter: 'Inorganic Chemistry', topicName: 'Coordination Bonding & Isomerism Spectrometry', isCompleted: false, isRevised: false, isWeak: false },
  { id: 'che-4', subject: 'Chemistry', chapter: 'Physical Chemistry', topicName: 'Chemical Kinetics & Arrhenius Equation Catalyst Rate', isCompleted: false, isRevised: false, isWeak: false }
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: '7 Day Discipline', description: 'Complete all daily tracking task blocks for 7 consecutive days', icon: 'Flame', unlocked: false, condition: '7-day streak' },
  { id: 'ach-2', title: '30 Day Discipline', description: 'Complete all daily tracking task blocks for 30 consecutive days', icon: 'Crown', unlocked: false, condition: '30-day streak' },
  { id: 'ach-3', title: '100 Study Hours', description: 'Accumulate a total of 100 study hours on the tracking monitor', icon: 'BookOpen', unlocked: false, condition: '100 study hours' },
  { id: 'ach-4', title: '50 Gym Sessions', description: 'Successfully execute 50 registered gym workout blocks', icon: 'Dumbbell', unlocked: false, condition: '50 gym sessions' },
  { id: 'ach-5', title: 'No Miss Day', description: 'Secure a perfect 100/100 Discipline Score for a single business day', icon: 'CheckCircle', unlocked: false, condition: '100 discipline score' }
];
