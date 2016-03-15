
var tools = {

	crossover: {

		_twoPointCrossver: function(parent1, parent1, mutationRate, crossoverRate)  {
			var newChildGenome = [];

			var randomPoint1 = Math.floor(Math.random() * (genomeLength)),
				randomPoint2 = Math.floor(Math.random() * (genomeLength));

			var lowestRandomPoint = randomPoint2 < randomPoint1 ? randomPoint2 : randomPoint1,
				highestRandomPoint = randomPoint2 > randomPoint1 ? randomPoint2 : randomPoint1;

			//get the genes in-between the two random points in second parent
			var selectedGenesFromParent2 = [];

			for(var geneIndex = lowestRandomPoint; geneIndex < highestRandomPoint; geneIndex++) 
				selectedGenesFromParent2.push(parent2.genome[geneIndex]);
			
			//push genes from first parent that aren't in the selected genes of second parent
			for(var geneIndex = 0; i < lowestRandomPoint; geneIndex++)  {
				if(selectedGenesFromParent2.indexOf(parent1.genome[geneIndex]))
					newChildGenome.push(parent1.genome[geneIndex]);
			}

			newChildGenome.concat(selectedGenesFromParent2);

			//go through rest of first parent's genome and push genes that weren't selected in second parent
			for(var geneIndex = lowestRandomPoint; geneIndex < parent1.genome.length; geneIndex++) {
				if(selectedGenesFromParent2.indexOf(parent1.genome[geneIndex]))
					newChildGenome.push(parent1.genome[geneIndex]);
			}
				
		},


		twoPointCrossver: function(par1, par2, mutateRate, crossoverRate) {
			var genomeLength = par1.genome.length;

			var newChildGenome = [];

			var crossoverProbability = Math.random();
			if(crossoverProbability < crossoverRate) {

				//get two random points in genome
				var r1 = Math.floor(Math.random() * (genomeLength)),
					r2 = Math.floor(Math.random() * (genomeLength));
					
				var lowestRandomPoint = r2 < r1 ? r2 : r1,
					highestRandomPoint = lowestRandomPoint == r2 ? r1 : r2,
					selectedGenesFromParent2 = [];

				for(var i = lowestRandomPoint; i <= highestRandomPoint; i++) {
					selectedGenesFromParent2.push(par2.genome[i]);
				}

				for(var i = 0; i < lowestRandomPoint; i++) {
					if(selectedGenesFromParent2.indexOf(par1.genome[i]) == -1)
						newChildGenome.push(par1.genome[i]);
				}

				newChildGenome = newChildGenome.concat(selectedGenesFromParent2);

				for(var i = lowestRandomPoint; i < par1.genome.length ; i++) {
					if(selectedGenesFromParent2.indexOf(par1.genome[i]) == -1)
						newChildGenome.push(par1.genome[i]);
				}

			} else {
				newChildGenome = par1.fitnessScore > par2.fitnessScore ? par1.genome : par2.genome;
			}

			var random = Math.random();
			if(random < mutateRate) {

				var k = Math.floor(Math.random() * (genomeLength - 1)),
				 	i = Math.floor(Math.random() * (genomeLength - 1));
			
				while(i == k) {
					i = Math.floor(Math.random() * (genomeLength - 1));
				}

				var lowestRandomPoint = k < i ? k : i,
					highestRandomPoint = lowestRandomPoint == k ? i : k,
				 
				newChildGenome = tools.crossover.twoOptSwapGenome(newChildGenome, lowestRandomPoint, highestRandomPoint);
				
			}

			return newChildGenome;
		},

		/*
		   2optSwap(route, i, k) {
		       1. take route[1] to route[i-1] and add them in order to new_route
		       2. take route[i] to route[k] and add them in reverse order to new_route
		       3. take route[k+1] to end and add them in order to new_route
		       return new_route;
		   }

		   i and k are random
		*/
		twoOptSwapGenome: function(genome, k, j) {
			var new_route = [];

			for(var i = 0; i <= k - 1; i ++) {
				new_route.push(genome[i]);			
			}

			//reverse order
			for(var i = j; i >= k; i--) {
				new_route.push(genome[i]);
			}
			
			for(var i = j + 1; i < genome.length; i++) {
				new_route.push(genome[i]);
			}
			
			return new_route;
		}
	},

	selection: {

		tournament: function(individuals, mutateRate) {
			var newGeneration = [];

			for(var i = 0; i < individuals.length; i++) {
				//get two random parents using tournament selection
				var par1 = tools.selection.tournamentSelect(individuals),
					par2 = tools.selection.tournamentSelect(individuals);

				//so we don't get the same exact parent
				while(par2 == par1) {
				 	par2 = tools.selection.tournamentSelect(individuals);
				}

				var child = new Individual();

				child.genome = tools.crossover.twoPointCrossver(par1, par2, mutateRate);
				child.fitnessScore = tools.fitnessTest(child);

				newGeneration.push(child);
			}

			return newGeneration;
		},

		tournamentSelect: function(individuals) {
			var selectedIndivs = [];
			var genePoolPopulation = Math.floor(TSP.populationCount * 0.2);

			//how many selected individuals we want
			for(var i = 0; i < genePoolPopulation; i++) {
				selectedIndivs.push(individuals[Math.floor(Math.random() * (individuals.length))]);
			}

			//find the fittest individual from the selected individuals
			var fittest = selectedIndivs[0];
			for(var i = 1; i < selectedIndivs.length; i++) {
				if(selectedIndivs[i].fitnessScore > fittest.fitnessScore) {
					fittest = selectedIndivs[i];
				}
			}

			return fittest;
		},

		/*
			Try roulette function without sorting the array
		*/
		roulette: function(individuals, mutateRate) {
			var newGeneration = [];

			var sumOfFitnesses = (function(individuals) {
				var sum = 0,
				individualsLength = individuals.length;
				
				for(var individualIndex = 0; individualIndex < individualsLength; individualIndex++)
					sum += individuals[individualIndex].fitnessScore;

				return sum;

			})(individuals);


			for(var individualIndex = 0; individualIndex < individuals.length; individualIndex++)
				individuals[individualIndex].probability = individuals[individualIndex].fitnessScore / sumOfFitnesses;
			
			// individuals.sort(function(a, b) {
			// 	return a.fitnessScore - b.fitnessScore;
			// });

			for(var individualIndex = 0; individualIndex < individuals.length; individualIndex++) {

				var parents = [];

				for(var parentIndex = 0; parentIndex < 2; parentIndex++) {
					parents.push(tools.selection.getInidividualRoulette(individuals));
				}

				var child = new Individual();
				child.genome = tools.crossover.twoPointCrossver(parents[0], parents[1], mutateRate);
				child.fitnessScore = tools.fitnessTest(child);

				newGeneration.push(child);
			}

			return newGeneration;

		},

		getInidividualRoulette: function(individuals) {
			var offset = 0;
			var randomNumber = Math.random();
			for(var individualIndex = 0; individualIndex < individuals.length; individualIndex++) {
				offset += individuals[individualIndex].probability;
				if(randomNumber < offset) {
					return individuals[individualIndex];
				}
			}
		}
	},

	fitnessTest: function(individual) {
		var totalDistance = 0,
		genomeLength = individual.genome.length - 1;

		//start distance from starting point
		totalDistance += tools.distanceToStartingPoint(individual, 0);

		for(var pointInRoute = 1; pointInRoute < genomeLength; pointInRoute++) {

			//distance formula
			var deltaX  = Math.pow(individual.genome[pointInRoute].x - individual.genome[pointInRoute - 1].x, 2),
				deltaY = Math.pow(individual.genome[pointInRoute].y - individual.genome[pointInRoute - 1].y, 2);
			
			totalDistance += (Math.sqrt(deltaX + deltaY));

		}

		//connect last point to starting point
		totalDistance += tools.distanceToStartingPoint(individual, genomeLength);

		return 1 / totalDistance;
	},


	distanceToStartingPoint: function(indiv, genomeIndex) {

		var deltaX = Math.abs(Math.pow(TSP.startingPoint.x - indiv.genome[genomeIndex].x, 2)),
			deltaY = Math.abs(Math.pow(TSP.startingPoint.y - indiv.genome[genomeIndex].y, 2));
		
		return (Math.sqrt(deltaX + deltaY));
	},
};