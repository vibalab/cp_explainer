import numpy as np
import numba
import math
import pygad

class Borgatti_Everett:
    def __init__(self, G, A, n):
        self.G = G
        self.A = A
        self.n = n

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def create_core_periphery_matrix(n, core_indices):
        delta = np.zeros((n, n))
        core_indices_set = set(core_indices)  # Convert list to set for faster lookup
        for i in range(n):
            if i in core_indices_set:
                delta[i, :] = 1
                delta[:, i] = 1
        return delta
    
    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def pearson_correlation(x, y):
        n = len(x)
        sum_x = 0.0
        sum_y = 0.0
        sum_x_sq = 0.0
        sum_y_sq = 0.0
        sum_xy = 0.0
        
        for i in range(n):
            sum_x += x[i]
            sum_y += y[i]
            sum_x_sq += x[i] ** 2
            sum_y_sq += y[i] ** 2
            sum_xy += x[i] * y[i]
        
        numerator = sum_xy - (sum_x * sum_y / n)
        denominator = np.sqrt((sum_x_sq - sum_x ** 2 / n) * (sum_y_sq - sum_y ** 2 / n))
        
        if denominator == 0:
            return 0.0
        else:
            return numerator / denominator
        
    def borgatti_everett_correlation(self, core_indices):
        n = self.A.shape[0]
        delta = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        delta_flat = delta.flatten()
        # Compute Pearson correlation
        rho = self.pearson_correlation(A_flat, delta_flat)
        return rho

    def fitness_function_borgatti_everett(self, ga_instance, solution, solution_idx):
        core_indices = np.where(solution > 0.5)[0]  # Vectorized way to find core indices
        if core_indices.size == 0:
            return -1
        rho = self.borgatti_everett_correlation(core_indices)
        return rho if np.isfinite(rho) else -1

    def initial_sol(self) :
        # 각 노드의 degree 계산
        degrees = dict(self.G.degree())

        # degree 수 기준으로 노드 정렬 (노드가 문자열일 경우)
        sorted_nodes = sorted(degrees, key=degrees.get, reverse=True)

        # 노드 이름을 인덱스로 변환하는 매핑 생성
        node_to_index = {node: idx for idx, node in enumerate(self.G.nodes)}

        if self.n == 1 :
            return [1]

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
        solution_1 = np.zeros(num_nodes)
        solution_1[top_1_nodes] = 1
        initial_population.append(solution_1)

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


    def run_genetic_algorithm(self, iter=1000):
        initial_population = self.initial_sol()
        ga_instance_borgatti = pygad.GA(
            num_generations=iter,
            num_parents_mating=2,
            fitness_func=self.fitness_function_borgatti_everett,
            sol_per_pop=initial_population.shape[0],
            num_genes=initial_population.shape[1],
            initial_population=initial_population,
            gene_type=int,
            gene_space=[0, 1],  # Genes will be floats between 0 and 1
            mutation_type="random",
            mutation_percent_genes=10,
        )

        # Run the genetic algorithm for Borgatti and Everett correlation
        ga_instance_borgatti.run()

        return ga_instance_borgatti