import numpy as np
import numba
import math
import pygad

class Brusco:
    def __init__(self, G, A, n):
        self.G = G
        self.A = A
        self.n = n

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def calculate_brusco_metric(A, n, core_indices, periphery_indices):
        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if A[i, j] == 1:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if A[i, j] == 0:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def get_periphery_indices(n, core_indices) :
        periphery_indices = [i for i in range(n) if i not in core_indices]
        return periphery_indices

    def brusco_metric(self, core_indices):
        n = self.A.shape[0]
        periphery_indices = self.get_periphery_indices(n, core_indices)
        return self.calculate_brusco_metric(self.A, n, core_indices, periphery_indices)

    def fitness_function_brusco_metric(self, ga_instance, solution, solution_idx):
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:
            return -1
        Z = self.brusco_metric(core_indices)
        return Z if np.isfinite(Z) else -1
    
    def initial_sol(self) :
        # 각 노드의 degree 계산
        degrees = dict(self.G.degree())

        # degree 수 기준으로 노드 정렬 (노드가 문자열일 경우)
        sorted_nodes = sorted(degrees, key=degrees.get, reverse=True)

        # 노드 이름을 인덱스로 변환하는 매핑 생성
        node_to_index = {node: idx for idx, node in enumerate(self.G.nodes)}

        # 상위 10개, 20개, 30개 노드 선택
        top_1_nodes = [node_to_index[node] for node in sorted_nodes[:int(math.ceil(self.n*0.01))]]
        top_10_nodes = [node_to_index[node] for node in sorted_nodes[:int(self.n*0.1)]]
        top_20_nodes = [node_to_index[node] for node in sorted_nodes[:int(self.n*0.2)]]
        top_30_nodes = [node_to_index[node] for node in sorted_nodes[:int(self.n*0.3)]]
        top_40_nodes = [node_to_index[node] for node in sorted_nodes[:int(self.n*0.4)]]
        top_50_nodes = [node_to_index[node] for node in sorted_nodes[:int(self.n*0.5)]]

        # 초기 해 집합 생성
        num_nodes = len(self.G.nodes)
        initial_population = []

        # 상위 1%개 노드에 1을 넣은 해
        # solution_1 = np.zeros(num_nodes)
        # solution_1[top_1_nodes] = 1
        # initial_population.append(solution_1)

        # 상위 10% 노드에 1을 넣은 해
        solution_10 = np.zeros(num_nodes)
        solution_10[top_10_nodes] = 1
        initial_population.append(solution_10)

        # 상위 20% 노드에 1을 넣은 해
        solution_20 = np.zeros(num_nodes)
        solution_20[top_20_nodes] = 1
        initial_population.append(solution_20)

        # 상위 30% 노드에 1을 넣은 해
        solution_30 = np.zeros(num_nodes)
        solution_30[top_30_nodes] = 1
        initial_population.append(solution_30)

        # 상위 40% 노드에 1을 넣은 해
        solution_40 = np.zeros(num_nodes)
        solution_40[top_40_nodes] = 1
        initial_population.append(solution_40)

        # 상위 50% 노드에 1을 넣은 해
        solution_50 = np.zeros(num_nodes)
        solution_50[top_50_nodes] = 1
        initial_population.append(solution_50)

        # initial_population을 numpy array로 변환
        initial_population = np.array(initial_population)
        return initial_population


    def fit(self, iter=1000):
        initial_population = self.initial_sol()
        ga_instance_brusco = pygad.GA(
            num_generations=iter,
            num_parents_mating=2,
            fitness_func=self.fitness_function_brusco_metric,
            sol_per_pop=initial_population.shape[0],
            num_genes=initial_population.shape[1],
            initial_population=initial_population,
            gene_type=int,
            gene_space=[0, 1],  # Genes will be floats between 0 and 1
            mutation_type="random",
            mutation_percent_genes=10,
        )

        # Run the genetic algorithm for Borgatti and Everett correlation

        ga_instance_brusco.run()
        solution_brusco, solution_fitness_brusco, solution_idx_brusco = ga_instance_brusco.best_solution()

        return solution_brusco, solution_fitness_brusco, solution_idx_brusco